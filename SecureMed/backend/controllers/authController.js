// backend/controllers/authController.js
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Import DoctorApplication model
import DoctorApplication from "../models/DoctorApplication.js";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, medicalId, specialization, department, phone, experience, hospital } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    // Check if email already exists as user
    const existingUser = await User.findOne({ email });
    // Check if there's already a pending doctor application
    const existingApp = await DoctorApplication.findOne({ email, status: 'Pending' });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    if (existingApp) {
      return res.status(400).json({ message: "A registration request for this email is already pending approval" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'patient') {
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'patient',
        // Optional fields for patient
        medicalId: medicalId || null,
        phone: phone || null,
        department: department || null
      });
      await newUser.save();

      return res.status(201).json({
        message: "Patient account created successfully",
        user: { 
          id: newUser._id, 
          name, 
          email, 
          role: 'patient' 
        }
      });
    } 
    else if (role === 'doctor') {
      if (!medicalId || !specialization || !department) {
        return res.status(400).json({
          message: "Medical ID, specialization and department are required for doctor registration"
        });
      }

      const newApplication = new DoctorApplication({
        name,
        email,
        password: hashedPassword,
        medicalId,
        specialization,
        department,
        phone: phone || null,
        experience: experience || null,
        hospital: hospital || "City General Hospital",
        status: 'Pending'
      });

      await newApplication.save();

      return res.status(201).json({
        message: "Doctor registration request submitted successfully. Waiting for admin approval.",
        applicationId: newApplication._id
      });
    } 
    else {
      return res.status(400).json({ message: "Invalid role. Only 'patient' or 'doctor' allowed." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

/* ================= GET PENDING APPLICATIONS ================= */
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await DoctorApplication.find({ status: 'Pending' })
      .select('-password')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch applications", error: err.message });
  }
};

/* ================= APPROVE DOCTOR ================= */
export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const application = await DoctorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== 'Pending') {
      return res.status(400).json({ message: "Application already processed" });
    }

    // Create actual Doctor User
    const newDoctor = new User({
      name: application.name,
      email: application.email,
      password: application.password,
      role: 'doctor',
      medicalId: application.medicalId,
      specialization: application.specialization,
      department: application.department,
      phone: application.phone,
      experience: application.experience,
      hospital: application.hospital
    });

    await newDoctor.save();

    // Update application status
    application.status = 'Approved';
    application.approvedBy = approvedBy || 'Admin Singh';
    application.approvedAt = new Date();
    await application.save();

    res.json({
      message: `Doctor ${application.name} approved successfully`,
      doctorId: newDoctor._id
    });
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message });
  }
};

/* ================= REJECT DOCTOR ================= */
export const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, rejectedBy } = req.body;

    const application = await DoctorApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== 'Pending') {
      return res.status(400).json({ message: "Application already processed" });
    }

    application.status = 'Rejected';
    application.rejectionReason = reason || "Not approved by admin";
    application.rejectedBy = rejectedBy || 'Admin Singh';
    await application.save();

    res.json({
      message: `Application from ${application.name} has been rejected`,
      reason: application.rejectionReason
    });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed", error: err.message });
  }
};

/* ================= LOGIN - Enhanced Version (Supports Email or Name) ================= */
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
        { name: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, "i") } },
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};