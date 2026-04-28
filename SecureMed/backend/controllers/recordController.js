// backend/controllers/recordController.js
import { v4 as uuidv4 }   from "uuid";
import Record              from "../models/Record.js";
import { preEncrypt, cpAbeEncrypt, cpAbeDecrypt } from "../services/preService.js";
import { uploadEncryptedBundle, fetchEncryptedBundle, gatewayUrl } from "../services/ipfsService.js";
import { uploadRecord as fabricUpload, queryByDepartment } from "../services/fabricService.js";

// ── POST /api/records/upload ──────────────────────────────────────────────────
// Accepts JSON: { title, type, accessPolicy, fileName, fileData (base64) }
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

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, "base64");

    // ── 1. PRE-encrypt ────────────────────────────────────────────────
    console.log("🔐 Encrypting file with PQ-Kyber768...");
    const encResult = await preEncrypt(pkOwner, fileBuffer);

    // ── 2. Upload to IPFS ─────────────────────────────────────────────
    console.log("📤 Uploading to IPFS...");
    const ipfsCid = await uploadEncryptedBundle(encResult, fileName);
    console.log("✅ IPFS CID:", ipfsCid);

    // ── 3. CP-ABE encrypt CID ─────────────────────────────────────────
    const policy = accessPolicy || `department::${department}|role::doctor`;
    const encryptedCID = await cpAbeEncrypt(ipfsCid, policy);

    // ── 4. Write to Fabric ────────────────────────────────────────────
    const fabricRecordId = uuidv4();
    await fabricUpload({
      userId:       fabricUserId || "admin",
      recordID:     fabricRecordId,
      uploaderID:   userId,
      department:   department,
      accessPolicy: policy,
      encryptedCID: encryptedCID
    });

    // ── 5. Save to MongoDB ────────────────────────────────────────────
    const newRecord = new Record({
      title,
      type,
      fileName,
      ipfsCid,
      fabricRecordId,
      encryptedCID,
      accessPolicy:     policy,
      capsule:          encResult.ct_kem,
      userId,
      uploaderFabricId: fabricUserId || "admin",
      pkOwner
    });
    await newRecord.save();

    res.status(201).json({
      success: true,
      message: "File encrypted, stored on IPFS and anchored on blockchain",
      data: {
        title,
        fileName,
        ipfsCid,
        fabricRecordId,
        accessPolicy: policy,
        ipfsUrl:      gatewayUrl(ipfsCid)
      }
    });

  } catch (error) {
    console.error("❌ Upload Error:", error.stack || error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack:   error.stack
    });
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
    const fabricRecords = await queryByDepartment({
      userId: fabricId, department: queryDept, requestTimestamp
    });

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