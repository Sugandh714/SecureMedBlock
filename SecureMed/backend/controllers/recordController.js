// backend/controllers/recordController.js
import { v4 as uuidv4 }   from "uuid";
import Record              from "../models/Record.js";
import upload              from "../middleware/upload.js";
import { preEncrypt, cpAbeEncrypt, cpAbeDecrypt } from "../services/preService.js";
import { uploadEncryptedBundle, fetchEncryptedBundle, gatewayUrl } from "../services/ipfsService.js";
import { uploadRecord as fabricUpload, queryByDepartment } from "../services/fabricService.js";

// ── POST /api/records/upload ──────────────────────────────────────────────────
// Patient uploads a file.
// Flow: PRE encrypt → IPFS → CP-ABE encrypt CID → Fabric metadata → MongoDB
export const uploadRecord = [
  upload.single("file"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { title, type, accessPolicy } = req.body;
      if (!title || !type) {
        return res.status(400).json({ success: false, message: "Title and type are required" });
      }

      const user           = req.user;
      const userId         = user._id.toString();
      const fabricUserId   = user.fabricUserId;
      const pkOwner        = user.pkPre;
      const department     = user.department || type;

      if (!pkOwner) {
        return res.status(400).json({
          success: false,
          message: "PRE public key not set. Please register your key via /api/auth/register-key first."
        });
      }

      // ── 1. PRE-encrypt the file ───────────────────────────────────────────
      console.log("🔐 Encrypting file...");
      const { capsule, ciphertext } = await preEncrypt(pkOwner, req.file.buffer);

      // ── 2. Upload encrypted bundle to IPFS ───────────────────────────────
      console.log("📤 Uploading to IPFS...");
      const ipfsCid = await uploadEncryptedBundle(capsule, ciphertext, req.file.originalname);
      console.log("✅ IPFS CID:", ipfsCid);

      // ── 3. CP-ABE encrypt the CID ────────────────────────────────────────
      const policy = accessPolicy || `department::${department}|role::doctor`;
      console.log("🔑 CP-ABE encrypting CID with policy:", policy);
      const encryptedCID = await cpAbeEncrypt(ipfsCid, policy);

      // ── 4. Write metadata to Fabric ──────────────────────────────────────
      const fabricRecordId = uuidv4();
      const fabricId       = fabricUserId || "admin"; // fallback for testing

      console.log("⛓️  Writing to Fabric...");
      await fabricUpload({
        userId:      fabricId,
        recordID:    fabricRecordId,
        uploaderID:  userId,
        department:  department,
        accessPolicy: policy,
        encryptedCID: encryptedCID
      });
      console.log("✅ Fabric record:", fabricRecordId);

      // ── 5. Save to MongoDB ────────────────────────────────────────────────
      const newRecord = new Record({
        title,
        type,
        fileName:         req.file.originalname,
        ipfsCid,
        fabricRecordId,
        encryptedCID,
        accessPolicy:     policy,
        capsule,
        userId,
        uploaderFabricId: fabricId,
        pkOwner
      });
      await newRecord.save();

      res.status(201).json({
        success: true,
        message: "File encrypted, stored on IPFS and anchored on blockchain",
        data: {
          title,
          fileName:      req.file.originalname,
          ipfsCid,
          fabricRecordId,
          accessPolicy:  policy,
          ipfsUrl:       gatewayUrl(ipfsCid)
        }
      });

    } catch (error) {
      console.error("❌ Upload Error:", error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: error.response?.data?.error || error.message
      });
    }
  }
];

// ── GET /api/records — patient's own records ──────────────────────────────────
export const getRecords = async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user._id.toString() })
      .sort({ uploadedAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/records/discover — doctor discovers records ─────────────────────
// Doctor sends their skAbe (attribute key); backend attempts CP-ABE decrypt
// of each encryptedCID returned from Fabric. Only matching ones succeed.
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

    // Decode skAbe → attributes list
    const attributes       = JSON.parse(Buffer.from(user.skAbe, "base64").toString());
    const queryDept        = department || user.department;
    const requestTimestamp = Math.floor(Date.now() / 1000);
    const fabricId         = user.fabricUserId || "admin";

    console.log(`🔍 Doctor ${user.name} discovering records in dept: ${queryDept}`);

    // Query Fabric for records in department
    const fabricRecords = await queryByDepartment({
      userId:           fabricId,
      department:       queryDept,
      requestTimestamp
    });

    console.log(`   Found ${fabricRecords.length} records on ledger`);

    // Attempt CP-ABE decrypt of each CID — silent fail on mismatch
    const accessible = [];
    for (const rec of fabricRecords) {
      try {
        const cid = await cpAbeDecrypt(rec.encryptedCID, attributes);
        accessible.push({ ...rec, cid });
      } catch (_) {
        // Attribute mismatch — record not visible to this doctor
      }
    }

    console.log(`   ${accessible.length} records accessible to ${user.name}`);
    res.json({ success: true, data: accessible });

  } catch (error) {
    console.error("❌ Discover Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};