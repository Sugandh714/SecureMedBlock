
/*import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },           // e.g. "Cardiology", "Radiology"
  fileName: { type: String, required: true },
  fileUrl: { type: String },                                    // Will be used later for IPFS
  userId: { type: String, required: true },                     // Dummy userId for now
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Record", recordSchema);*/
// backend/models/Record.js
import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },        // e.g. "Cardiology", "Radiology", "Blood Test"
  fileName: { type: String, required: true },
  ipfsCid: { type: String, required: true },                 // IPFS Content ID
  userId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Record", recordSchema);