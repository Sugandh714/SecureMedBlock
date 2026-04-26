// models/DoctorApplication.js
import mongoose from "mongoose";

const doctorApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  medicalId: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  phone: String,
  experience: String,
  hospital: {
    type: String,
    default: "City General Hospital"
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: String,
  rejectedBy: String,
  rejectionReason: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date
}, { timestamps: true });

const DoctorApplication = mongoose.model("DoctorApplication", doctorApplicationSchema);

export default DoctorApplication;