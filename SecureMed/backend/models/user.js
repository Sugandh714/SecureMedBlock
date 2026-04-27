// backend/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  username:       { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ["patient", "doctor", "admin"], required: true },
  medicalId:      String,
  specialization: String,
  department:     String,
  phone:          String,
  experience:     String,
  hospital:       String,

  // ── Fabric ──────────────────────────────────────
  fabricUserId:   { type: String, default: null },   // e.g. "doctor_<mongoId>"
  fabricEnrolled: { type: Boolean, default: false },

  // ── PRE public key ───────────────────────────────
  // Generated client-side via /pre/keygen, stored here
  // so others can encrypt files to this user
  pkPre:          { type: String, default: null },

  // ── CP-ABE attribute key ─────────────────────────
  // Issued by admin via /cpabe/issue-key
  // base64 of JSON attribute list
  skAbe:          { type: String, default: null }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;