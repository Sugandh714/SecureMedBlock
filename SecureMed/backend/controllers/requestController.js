// backend/controllers/requestController.js
import AccessRequest  from "../models/AccessRequest.js";
import Record         from "../models/Record.js";
import { preRekey, preReencrypt } from "../services/preService.js";
import { fetchEncryptedBundle, uploadReencryptedBundle, gatewayUrl }
  from "../services/ipfsService.js";

// ── POST /api/requests — doctor requests access to a record ───────────────────
export const createRequest = async (req, res) => {
  try {
    const { recordId } = req.body;
    const doctor       = req.user;

    if (!doctor.pkPre) {
      return res.status(400).json({
        success: false,
        message: "PRE public key not set. Update your profile first."
      });
    }

    const record = await Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Prevent duplicate pending request
    const existing = await AccessRequest.findOne({
      doctorId: doctor._id.toString(),
      recordId,
      status:   "pending"
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Request already pending" });
    }

    const newRequest = new AccessRequest({
      doctorId:       doctor._id.toString(),
      doctorFabricId: doctor.fabricUserId || null,
      doctorName:     doctor.name,
      pkDoctor:       doctor.pkPre,
      recordId,
      fabricRecordId: record.fabricRecordId,
      patientId:      record.userId
    });

    await newRequest.save();
    console.log(`📨 Access request from Dr. ${doctor.name} for record ${recordId}`);
    res.status(201).json({ success: true, data: newRequest });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/requests — patient sees all incoming requests ────────────────────
export const getRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({
      patientId: req.user._id.toString()
    }).sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/requests/:id/approve — patient approves, PRE re-encryption runs ─
// Patient sends their SK_pre in body — transmitted over TLS, NEVER stored
export const approveRequest = async (req, res) => {
  try {
    const { skOwner } = req.body;
    if (!skOwner) {
      return res.status(400).json({
        success: false,
        message: "skOwner (your PRE private key) is required to approve access"
      });
    }

    const accessReq = await AccessRequest.findById(req.params.id);
    if (!accessReq) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (accessReq.patientId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (accessReq.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request already resolved" });
    }

    const record = await Record.findById(accessReq.recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
// ── 1. Fetch encrypted bundle from IPFS ─────────────────────────────
console.log("📥 Fetching encrypted bundle from IPFS...");
const bundle = await fetchEncryptedBundle(record.ipfsCid);
console.log("Bundle keys:", Object.keys(bundle));
console.log("ct_kem present:", !!bundle.ct_kem);
console.log("ct_kem length:", bundle.ct_kem?.length);

// ── 2. Patient generates re-encryption material ──────────────────────
console.log("🔑 Generating PQ re-encryption key material...");
const rekeyResult = await preRekey(
  skOwner,
  accessReq.pkDoctor,
  bundle.ct_kem        // ← USE bundle.ct_kem DIRECTLY, not record.capsule
);
//     // ── 1. Fetch encrypted bundle from IPFS ─────────────────────────────
// console.log("📥 Fetching encrypted bundle from IPFS...");
// const bundle = await fetchEncryptedBundle(record.ipfsCid);
// console.log("Bundle keys:", Object.keys(bundle));
// console.log("ct_kem present:", !!bundle.ct_kem);
// // ── 2. Patient generates re-encryption material ──────────────────────
// console.log("🔑 Generating PQ re-encryption key material...");
// const rekeyResult = await preRekey(
//   skOwner,
//   accessReq.pkDoctor,
//   record.ct_kem       // ct_kem stored in MongoDB
// );
// rekeyResult = { ct_kem2, key_capsule, kc_nonce, kc_tag }
console.log("ct_kem from record.capsule:", record.capsule?.substring(0, 30));
console.log("ct_kem from bundle:", bundle.ct_kem?.substring(0, 30));
console.log("Are they equal:", record.capsule === bundle.ct_kem);
// In requestController.js, add right after fetching record:
console.log("record.capsule length:", record.capsule?.length);
console.log("record.capsule type:", typeof record.capsule);
console.log("bundle.ct_kem length:", bundle.ct_kem?.length);
console.log("Are they same:", record.capsule === bundle.ct_kem);
// ── 3. Proxy bundles re-encrypted material — NO plaintext produced ───
console.log("🔄 Proxy bundling re-encrypted material...");
const reencBundle = await preReencrypt(rekeyResult, bundle, record.pkOwner);

// ── 4. Upload re-encrypted bundle to IPFS ───────────────────────────
console.log("📤 Uploading re-encrypted bundle to IPFS...");
const reencCid = await uploadReencryptedBundle(
  reencBundle,
  `reenc_${accessReq.doctorId}_${record._id}`
);

    // ── 5. Update access request ─────────────────────────────────────────────
    accessReq.status     = "approved";
    accessReq.reencCid   = reencCid;
    accessReq.pkOwner    = record.pkOwner;
    accessReq.resolvedAt = new Date();
    await accessReq.save();

    console.log(`✅ Access approved. Re-enc CID: ${reencCid}`);
    res.json({
      success: true,
      message: "Access approved successfully",
      data: { reencCid, ipfsUrl: gatewayUrl(reencCid) }
    });

  } catch (error) {
    console.error("❌ Approve Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/requests/:id/reject ────────────────────────────────────────────
export const rejectRequest = async (req, res) => {
  try {
    const accessReq = await AccessRequest.findById(req.params.id);
    if (!accessReq) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (accessReq.patientId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    accessReq.status     = "rejected";
    accessReq.resolvedAt = new Date();
    await accessReq.save();

    res.json({ success: true, message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/requests/:id/fetch — doctor fetches re-encrypted bundle ──────────
export const fetchApprovedBundle = async (req, res) => {
  try {
    const accessReq = await AccessRequest.findById(req.params.id);
    if (!accessReq) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (accessReq.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (accessReq.status !== "approved") {
      return res.status(403).json({ success: false, message: "Request not yet approved" });
    }

    // Doctor decrypts this bundle locally using their SK — never sent to server
    res.json({
      success: true,
      data: {
        reencCid: accessReq.reencCid,
        pkOwner:  accessReq.pkOwner,
        ipfsUrl:  gatewayUrl(accessReq.reencCid)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/requests/doctor — doctor sees their own outgoing requests ─────────
export const getDoctorRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({
      doctorId: req.user._id.toString()
    }).sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};