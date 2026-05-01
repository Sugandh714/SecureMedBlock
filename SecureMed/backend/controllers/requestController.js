// backend/controllers/requestController.js
//
// KEY SECURITY CHANGE in approveRequest:
//
//   OLD: received skOwner → called preRekey() server-side → sk existed in server RAM
//   NEW: receives { ct_kem2, key_capsule, kc_nonce, kc_tag } — the output of
//        browser-side clientSideRekey(). Server does zero crypto with any private key.
//        preReencrypt() was already a passthrough — it just assembles fields for IPFS.

import AccessRequest from "../models/AccessRequest.js";
import Record        from "../models/Record.js";
import { preReencrypt }                              from "../services/preService.js";
import { fetchEncryptedBundle, uploadReencryptedBundle, gatewayUrl } from "../services/ipfsService.js";
// preRekey import removed — browser now does this

// ── POST /api/requests — doctor requests access to a record ──────────────────
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

    const existing = await AccessRequest.findOne({
      doctorId: doctor._id.toString(),
      recordId,
      status:   "pending",
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
      patientId:      record.userId,
    });

    await newRequest.save();
    console.log(`📨 Access request from Dr. ${doctor.name} for record ${recordId}`);
    res.status(201).json({ success: true, data: newRequest });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/requests — patient sees all incoming requests ───────────────────
export const getRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({
      patientId: req.user._id.toString()
    }).sort({ requestedAt: -1 });

    // Include ct_kem from the record so the patient browser can run rekey
    const enriched = await Promise.all(requests.map(async (r) => {
      const obj = r.toObject();
      if (r.status === "pending") {
        const record = await Record.findById(r.recordId).select("ipfsCid pkOwner").lean();
        if (record) {
          try {
            const bundle = await fetchEncryptedBundle(record.ipfsCid);
            obj.ctKem    = bundle.ct_kem;   // ← needed by clientSideRekey in browser
            obj.pkOwner  = record.pkOwner;
          } catch {
            // IPFS unreachable during dev — ctKem will be undefined
          }
        }
      }
      return obj;
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/requests/:id/approve ───────────────────────────────────────────
// Browser ran clientSideRekey() and sends us the output.
// We receive { ct_kem2, key_capsule, kc_nonce, kc_tag } — no private key.
export const approveRequest = async (req, res) => {
  try {
    const { ct_kem2, key_capsule, kc_nonce, kc_tag } = req.body;

    if (!ct_kem2 || !key_capsule || !kc_nonce || !kc_tag) {
      return res.status(400).json({
        success: false,
        message: "Re-encryption bundle required: { ct_kem2, key_capsule, kc_nonce, kc_tag }. " +
                 "Run clientSideRekey() in the browser first."
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

    // Fetch original bundle from IPFS — need ct_file, nonce, tag for assembly
    console.log("📥 Fetching original encrypted bundle from IPFS...");
    const bundle = await fetchEncryptedBundle(record.ipfsCid);

    // Assemble re-encrypted bundle — preReencrypt is a pure passthrough,
    // no crypto involved, just packages fields for IPFS storage
    console.log("📦 Assembling re-encrypted bundle...");
    const reencBundle = await preReencrypt(
      { ct_kem2, key_capsule, kc_nonce, kc_tag },  // from browser
      bundle,                                        // ct_file, nonce, tag from IPFS
      record.pkOwner,
    );

    console.log("📤 Uploading re-encrypted bundle to IPFS...");
    const reencCid = await uploadReencryptedBundle(
      reencBundle,
      `reenc_${accessReq.doctorId}_${record._id}`
    );

    accessReq.status     = "approved";
    accessReq.reencCid   = reencCid;
    accessReq.pkOwner    = record.pkOwner;
    accessReq.resolvedAt = new Date();
    await accessReq.save();

    console.log(`✅ Access approved. Re-enc CID: ${reencCid}`);
    res.json({
      success: true,
      message: "Access approved successfully",
      data: { reencCid, ipfsUrl: gatewayUrl(reencCid) },
    });

  } catch (error) {
    console.error("❌ Approve Error:", error.message);
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

// ── GET /api/requests/:id/fetch — doctor fetches re-encrypted bundle ─────────
// Doctor decrypts this bundle in their own browser using their sk.
// Server returns ciphertext only — no decryption happens here.
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

    res.json({
      success: true,
      data: {
        reencCid: accessReq.reencCid,
        pkOwner:  accessReq.pkOwner,
        ipfsUrl:  gatewayUrl(accessReq.reencCid),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/requests/mine — doctor sees their own outgoing requests ──────────
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