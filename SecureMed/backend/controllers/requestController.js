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

    // ── 1. Generate re-key fragment (patient's SK used here, not stored) ────
    console.log("🔑 Generating re-encryption key fragment...");
    const kfrag = await preRekey(skOwner, accessReq.pkDoctor);

    // ── 2. Fetch encrypted bundle from IPFS ─────────────────────────────────
    console.log("📥 Fetching encrypted bundle from IPFS:", record.ipfsCid);
    const bundle = await fetchEncryptedBundle(record.ipfsCid);

    // ── 3. Proxy re-encrypts capsule — NO plaintext produced ────────────────
    console.log("🔄 Re-encrypting capsule (proxy operation)...");
    const cfrag = await preReencrypt(bundle.capsule, kfrag);

    // ── 4. Upload re-encrypted bundle to IPFS ───────────────────────────────
    console.log("📤 Uploading re-encrypted bundle to IPFS...");
    const reencCid = await uploadReencryptedBundle(
      cfrag,
      bundle.capsule,
      bundle.ciphertext,
      record.pkOwner,
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