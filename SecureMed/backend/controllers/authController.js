// backend/controllers/authController.js
import User              from "../models/user.js";
import bcrypt            from "bcrypt";
import jwt               from "jsonwebtoken";
import DoctorApplication from "../models/DoctorApplication.js";
import { preKeygen }     from "../services/preService.js";

/* ─────────────────────────────────────────────────────────────
   Helper — generate PRE keypair from the PRE microservice.
   Returns { pk, sk } or null if the service is unreachable
   (so registration doesn't hard-fail during local dev without
   the PRE service running — just log the warning).
───────────────────────────────────────────────────────────── */
async function generatePreKeypair() {
  try {
    const keys = await preKeygen(); // { sk, pk }
    if (!keys?.pk || !keys?.sk) throw new Error("preKeygen returned incomplete keys");
    return keys;
  } catch (err) {
    console.error("⚠️  PRE keygen failed — user will have pkPre=null:", err.message);
    return null;
  }
}

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const {
      name, email, password, role,
      medicalId, specialization, department,
      phone, experience, hospital
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const existingUser = await User.findOne({ email });
    const existingApp  = await DoctorApplication.findOne({ email, status: "Pending" });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    if (existingApp) {
      return res.status(400).json({
        message: "A registration request for this email is already pending approval"
      });
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Patient registration ───────────────────────────────────────────
    if (role === "patient") {
      // Generate PRE keypair — pk stored in DB, sk sent to client once
      const keys = await generatePreKeypair();

      const newUser = new User({
        name,
        email,
        password:   hashedPassword,
        role:       "patient",
        phone:      phone       || null,
        department: department  || null,
        pkPre:      keys?.pk    || null,   // ← public key stored server-side
      });
      await newUser.save();

      return res.status(201).json({
        message: "Patient account created successfully",
        // sk returned ONCE — client must save it locally (never re-sent)
        skPre: keys?.sk || null,
        user:  { id: newUser._id, name, email, role: "patient" }
      });
    }

    // ── Doctor registration (pending approval) ─────────────────────────
    if (role === "doctor") {
      if (!medicalId || !specialization || !department) {
        return res.status(400).json({
          message: "Medical ID, specialization and department are required for doctor registration"
        });
      }

      const newApplication = new DoctorApplication({
        name,
        email,
        password:      hashedPassword,
        medicalId,
        specialization,
        department,
        phone:      phone      || null,
        experience: experience || null,
        hospital:   hospital   || "City General Hospital",
        status:     "Pending"
      });
      await newApplication.save();

      // Doctor keypair is generated when admin APPROVES, not here,
      // because the User record doesn't exist yet.
      return res.status(201).json({
        message: "Doctor registration request submitted. Awaiting admin approval."
      });
    }

    return res.status(400).json({ message: "Invalid role. Only 'patient' or 'doctor' allowed." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

/* ================= GET PENDING APPLICATIONS ================= */
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await DoctorApplication.find({ status: "Pending" })
      .select("-password")
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications", error: err.message });
  }
};

/* ================= APPROVE DOCTOR ================= */
export const approveDoctor = async (req, res) => {
  try {
    const { id }         = req.params;
    const { approvedBy } = req.body;

    const application = await DoctorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== "Pending") {
      return res.status(400).json({ message: "Application already processed" });
    }

    // Generate PRE keypair for the new doctor at approval time
    const keys = await generatePreKeypair();

    const newDoctor = new User({
      name:           application.name,
      email:          application.email,
      password:       application.password,
      role:           "doctor",
      medicalId:      application.medicalId,
      specialization: application.specialization,
      department:     application.department,
      phone:          application.phone,
      experience:     application.experience,
      hospital:       application.hospital,
      pkPre:          keys?.pk || null,   // ← stored on the User document
    });
    await newDoctor.save();

    application.status     = "Approved";
    application.approvedBy = approvedBy || "Admin";
    application.approvedAt = new Date();
    await application.save();

    // skPre is returned here so admin can relay it to the doctor via
    // a secure channel (email / notification). It is never stored server-side.
    res.json({
      message:  `Doctor ${application.name} approved successfully`,
      doctorId: newDoctor._id,
      skPre:    keys?.sk || null,   // relay this securely to the doctor
    });
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message });
  }
};

/* ================= REJECT DOCTOR ================= */
export const rejectDoctor = async (req, res) => {
  try {
    const { id }                 = req.params;
    const { reason, rejectedBy } = req.body;

    const application = await DoctorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== "Pending") {
      return res.status(400).json({ message: "Application already processed" });
    }

    application.status          = "Rejected";
    application.rejectionReason = reason      || "Not approved by admin";
    application.rejectedBy      = rejectedBy  || "Admin";
    await application.save();

    res.json({
      message: `Application from ${application.name} has been rejected`,
      reason:  application.rejectionReason
    });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed", error: err.message });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { loginIdentifier, email, password, role } = req.body;
    const identifier = (loginIdentifier || email || "").trim();

    if (!identifier || !password || !role) {
      return res.status(400).json({ message: "Email/Name, password and role are required" });
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { name:  { $regex: new RegExp(`^${escapeRegex(identifier)}$`, "i") } },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.role !== role) {
      return res.status(403).json({ message: "Invalid role selected" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // If this is an existing patient/doctor who has no pkPre yet
    // (created before this fix), generate keys now on first login.
    let freshSk = null;
    if (!user.pkPre) {
      console.log(`🔑 Generating missing PRE keys for ${user.email} on login...`);
      const keys = await generatePreKeypair();
      if (keys) {
        user.pkPre = keys.pk;
        await user.save();
        freshSk = keys.sk; // sent down so the client can cache it
        console.log("✅ PRE keys generated and pk saved.");
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      // skPre is included when keys were just generated (first login for old accounts)
      // Undefined otherwise — client should already have it from registration
      ...(freshSk && { skPre: freshSk }),
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        // Let client know whether a key is configured
        hasPkPre: !!user.pkPre,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};