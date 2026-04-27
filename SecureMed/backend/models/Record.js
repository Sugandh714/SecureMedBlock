// backend/models/Record.js
import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  type:     { type: String, required: true, trim: true },
  fileName: { type: String, required: true },

  // ── IPFS ────────────────────────────────────────
  // CID of PRE-encrypted bundle {capsule, ciphertext}
  // Never stored plain on blockchain
  ipfsCid:  { type: String, required: true },

  // ── Blockchain ──────────────────────────────────
  fabricRecordId: { type: String, default: null },
  encryptedCID:   { type: String, default: null },  // CP-ABE ciphertext of ipfsCid
  accessPolicy:   { type: String, default: null },

  // ── PRE capsule ─────────────────────────────────
  // Stored here so approve flow can re-encrypt without re-fetching IPFS
  capsule:  { type: String, default: null },

  // ── Ownership ───────────────────────────────────
  userId:           { type: String, required: true },  // MongoDB _id of patient
  uploaderFabricId: { type: String, default: null },
  pkOwner:          { type: String, default: null },   // Patient PRE public key

  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Record", recordSchema);