// backend/controllers/recordController.js
import { v4 as uuidv4 }   from "uuid";
import Record              from "../models/Record.js";
import { preEncrypt, preDecrypt, cpAbeEncrypt, cpAbeDecrypt } from "../services/preService.js";
import { uploadEncryptedBundle, fetchEncryptedBundle, gatewayUrl } from "../services/ipfsService.js";
import { uploadRecord as fabricUpload, queryByDepartment } from "../services/fabricService.js";

// ── POST /api/records/upload ──────────────────────────────────────────────────
export const uploadRecord = async (req, res) => {
  try {
    const { title, type, accessPolicy, fileName, fileData } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ success: false, message: "fileName and fileData (base64) are required" });
    }
    if (!title || !type) {
      return res.status(400).json({ success: false, message: "Title and type are required" });
    }

    const user         = req.user;
    const userId       = user._id.toString();
    const fabricUserId = user.fabricUserId;
    const pkOwner      = user.pkPre;
    const department   = user.department || type;

    if (!pkOwner) {
      return res.status(400).json({
        success: false,
        message: "PRE public key not set. Register your key first."
      });
    }

    const fileBuffer = Buffer.from(fileData, "base64");

    console.log("🔐 Encrypting file with PQ-Kyber768...");
    const encResult = await preEncrypt(pkOwner, fileBuffer);

    console.log("📤 Uploading to IPFS...");
    const ipfsCid = await uploadEncryptedBundle(encResult, fileName);
    console.log("✅ IPFS CID:", ipfsCid);

    const policy       = accessPolicy || `department::${department}|role::doctor`;
    const encryptedCID = await cpAbeEncrypt(ipfsCid, policy);

    const fabricRecordId = uuidv4();
    await fabricUpload({
      userId:       fabricUserId || "admin",
      recordID:     fabricRecordId,
      uploaderID:   userId,
      department,
      accessPolicy: policy,
      encryptedCID
    });

    const newRecord = new Record({
      title, type, fileName, ipfsCid, fabricRecordId, encryptedCID,
      accessPolicy: policy,
      capsule:      encResult.ct_kem,
      userId,
      uploaderFabricId: fabricUserId || "admin",
      pkOwner
    });
    await newRecord.save();

    res.status(201).json({
      success: true,
      message: "File encrypted, stored on IPFS and anchored on blockchain",
      data: { title, fileName, ipfsCid, fabricRecordId, accessPolicy: policy, ipfsUrl: gatewayUrl(ipfsCid) }
    });

  } catch (error) {
    console.error("❌ Upload Error:", error.stack || error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// ── GET /api/records ──────────────────────────────────────────────────────────
export const getRecords = async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user._id.toString() })
      .sort({ uploadedAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/records/:id/decrypt ─────────────────────────────────────────────
// Patient decrypts their OWN file for preview/download.
// skOwner is sent over TLS and NEVER stored — used only for this request.
export const decryptRecord = async (req, res) => {
  try {
    const { skOwner } = req.body;
    if (!skOwner) {
      return res.status(400).json({ success: false, message: "skOwner is required" });
    }

    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Only the owner can decrypt
    if (record.userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    console.log(`🔓 Patient ${req.user.name} decrypting record "${record.title}"...`);

    // Fetch encrypted bundle from IPFS
    const bundle = await fetchEncryptedBundle(record.ipfsCid);

    // Decrypt using patient's private key — plaintext never stored
    const result = await preDecrypt(skOwner, bundle);

    // result.plaintext is base64 of original file bytes
    res.json({
      success:   true,
      plaintext: result.plaintext,   // base64 — client decodes and triggers download
      fileName:  record.fileName,
      mimeType:  guessMime(record.fileName),
    });

  } catch (error) {
    console.error("❌ Decrypt Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/records/discover ────────────────────────────────────────────────
export const discoverRecords = async (req, res) => {
  try {
    const { department } = req.body;
    const user           = req.user;

    if (!user.skAbe) {
      return res.status(400).json({
        success: false,
        message: "CP-ABE attribute key not set. Ask admin to issue your key."
      });
    }

    const attributes       = JSON.parse(Buffer.from(user.skAbe, "base64").toString());
    const queryDept        = department || user.department;
    const requestTimestamp = Math.floor(Date.now() / 1000);
    const fabricId         = user.fabricUserId || "admin";

    console.log(`🔍 Doctor ${user.name} discovering in dept: ${queryDept}`);
    const fabricRecords = await queryByDepartment({ userId: fabricId, department: queryDept, requestTimestamp });

    const accessible = [];
    for (const rec of fabricRecords) {
      try {
        const cid = await cpAbeDecrypt(rec.encryptedCID, attributes);
        accessible.push({ ...rec, cid });
      } catch (_) {}
    }

    res.json({ success: true, data: accessible });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────
function guessMime(fileName = "") {
  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    pdf:  "application/pdf",
    jpg:  "image/jpeg", jpeg: "image/jpeg",
    png:  "image/png",
    txt:  "text/plain",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] || "application/octet-stream";
}