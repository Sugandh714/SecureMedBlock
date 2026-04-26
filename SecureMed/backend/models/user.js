// models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { 
    type: String, 
    unique: true, 
    sparse: true,           // Allows null/undefined
    trim: true,
    lowercase: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin'], 
    required: true 
  },
  medicalId: String,
  specialization: String,
  department: String,
  phone: String,
  experience: String,
  hospital: String
}, { timestamps: true });

// backend/models/user.js
/*import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,           // Allows null/undefined
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
    },

    // Profile fields (common for all roles)
    profilePic: {
      type: String,
      default: "https://via.placeholder.com/150", // Default avatar
    },

    // Common optional fields
    phone: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    // Doctor-specific fields
    specialization: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
    },

    // Patient-specific fields
    medicalId: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: true 
  }
);

// Optional: Add a virtual or method to get public profile (excluding password)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};*/

const User = mongoose.model("User", userSchema);

export default User;