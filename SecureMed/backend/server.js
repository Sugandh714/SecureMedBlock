// backend/server.js
import dotenv from "dotenv";
dotenv.config();

import express    from "express";
import mongoose   from "mongoose";
import cors       from "cors";
import { execFile } from "child_process";
import path       from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import recordRoutes  from "./routes/recordRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

import {
  register, login,
  getPendingApplications,
  approveDoctor, rejectDoctor
} from "./controllers/authController.js";

import { issueAttributeKey } from "./services/preService.js";
import DoctorApplication     from "./models/DoctorApplication.js";
import User                  from "./models/user.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENROLL_SCRIPT = path.resolve(__dirname, "..", "enrollUser.js");

const app = express();

/* ─── MIDDLEWARE ──────────────────────────────────── */
app.use(express.json({ limit: '50mb' }));

/* ─── DATABASE ────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("DB Error ❌", err));

/* ─── AUTH ROUTES ─────────────────────────────────── */
app.post("/api/auth/register", register);
app.post("/api/auth/login",    login);

// ── Register PRE public key for a user ────────────────────────────────────────
// Called after login when user generates their keypair client-side
app.post("/api/auth/register-key", async (req, res) => {
  try {
    const { userId, pkPre } = req.body;
    if (!userId || !pkPre) {
      return res.status(400).json({ message: "userId and pkPre required" });
    }
    await User.findByIdAndUpdate(userId, { pkPre });
    res.json({ success: true, message: "PRE public key registered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── ADMIN — Doctor application routes ──────────── */
app.get("/api/auth/applications/pending", getPendingApplications);

// Approve: existing logic + Fabric enroll + CP-ABE key issuance
app.post("/api/auth/applications/:id/approve", async (req, res) => {
  try {
    // 1. Run original approval (creates User doc, sends response)
    await approveDoctor(req, res);

    // 2. Post-approval: Fabric enroll + issue CP-ABE attribute key
    //    Response already sent — run async without blocking
    setImmediate(async () => {
      try {
        const application = await DoctorApplication.findById(req.params.id);
        if (!application || application.status !== "Approved") return;

        const doctorUser = await User.findOne({ email: application.email });
        if (!doctorUser) return;

        const fabricUserId = `doctor_${doctorUser._id.toString()}`;

        // Enroll Fabric identity
        execFile("node", [ENROLL_SCRIPT, fabricUserId, "doctor", application.department],
          { cwd: path.resolve(__dirname, '..') },
          async (err, stdout, stderr) => {
            if (err) {
              console.error("❌ Fabric enroll failed:", stderr);
              return;
            }
            console.log("✅ Fabric identity enrolled:", stdout.trim());

            // Issue CP-ABE attribute key
            const attrs = [
              `department::${application.department.toLowerCase()}`,
              "role::doctor"
            ];
            const { sk_abe } = await issueAttributeKey(fabricUserId, attrs);

            // Update User with fabricUserId + skAbe
            await User.findByIdAndUpdate(doctorUser._id, {
              fabricUserId,
              fabricEnrolled: true,
              skAbe: sk_abe
            });

            // Update Application with fabricUserId
            await DoctorApplication.findByIdAndUpdate(application._id, { fabricUserId });

            console.log(`✅ Doctor ${doctorUser.name} fully provisioned`);
            console.log(`   Fabric ID: ${fabricUserId}`);
            console.log(`   ABE attrs: ${attrs.join(", ")}`);
          }
        );
      } catch (postErr) {
        console.error("❌ Post-approval setup failed:", postErr.message);
      }
    });

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Approval failed", error: err.message });
    }
  }
});

app.post("/api/auth/applications/:id/reject", rejectDoctor);

/* ─── FEATURE ROUTES ──────────────────────────────── */
app.use("/api/profile",  profileRoutes);
app.use("/api/records",  recordRoutes);
app.use("/api/requests", requestRoutes);

/* ─── START ───────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   PRE service: ${process.env.PRE_SERVICE_URL || "http://localhost:5001"}`);
});