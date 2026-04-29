// backend/controllers/logController.js
import Record        from "../models/Record.js";
import AccessRequest from "../models/AccessRequest.js";

// ── GET /api/logs ─────────────────────────────────────────────────────────────
// Returns a unified, time-sorted audit trail for the logged-in patient.
// Combines: record uploads + access requests (approved/rejected/pending)
export const getLogs = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // ── 1. Record upload events ───────────────────────────────────────
    const records = await Record.find({ userId }).sort({ uploadedAt: -1 });
    const uploadLogs = records.map(r => ({
      id:        r._id.toString(),
      action:    "UPLOAD",
      actor:     req.user.name || "You",
      detail:    `Uploaded "${r.title}" (${r.type})`,
      time:      new Date(r.uploadedAt).toLocaleString("en-IN"),
      timestamp: new Date(r.uploadedAt).getTime(),
      hash:      r.fabricRecordId || r.ipfsCid || null,
    }));

    // ── 2. Access request events ──────────────────────────────────────
    const requests = await AccessRequest.find({ patientId: userId })
      .sort({ requestedAt: -1 });

    const requestLogs = requests.map(r => {
      let action = "ACCESS_REQUEST";
      let detail = `Dr. ${r.doctorName} requested access`;

      if (r.status === "approved") {
        action = "ACCESS_GRANTED";
        detail = `Access granted to Dr. ${r.doctorName}`;
      } else if (r.status === "rejected") {
        action = "ACCESS_DENIED";
        detail = `Access denied for Dr. ${r.doctorName}`;
      }

      const ts = r.resolvedAt || r.requestedAt;
      return {
        id:        r._id.toString(),
        action,
        actor:     r.doctorName || "Doctor",
        detail,
        time:      new Date(ts).toLocaleString("en-IN"),
        timestamp: new Date(ts).getTime(),
        hash:      r.fabricRecordId || null,
      };
    });

    // ── 3. Merge and sort by time descending ──────────────────────────
    const allLogs = [...uploadLogs, ...requestLogs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ timestamp, ...rest }) => rest); // strip internal sort key

    res.json({ success: true, data: allLogs });

  } catch (error) {
    console.error("❌ Logs Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};