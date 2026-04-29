import { useState, useEffect } from "react";
import { getRequests, approveRequest, rejectRequest } from "../../services/api";

const STATUS_STYLES = {
  pending:  { bg: "#fef3c7", color: "#92400e", label: "Pending"  },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
        No access requests found.
      </td>
    </tr>
  );
}

export default function AccessRequests() {
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  // Track which row is mid-request to prevent double-clicks
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    getRequests()
      .then(res => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Calls the dedicated POST endpoint for approve or reject,
   * then updates local state so the row reflects the change immediately.
   */
  const handleAction = async (id, action) => {
    setActioningId(id);
    try {
      if (action === "approved") {
        await approveRequest(id);
      } else {
        await rejectRequest(id);
      }
      // Optimistic local update
      setRequests(prev =>
        prev.map(r => r._id === id ? { ...r, status: action } : r)
      );
    } catch (err) {
      console.error(`Failed to ${action} request ${id}:`, err.message);
      // Optional: surface error in UI here
    } finally {
      setActioningId(null);
    }
  };

  const filtered = filter === "all"
    ? requests
    : requests.filter(r => r.status === filter);

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const FILTERS = [
    { key: "all",      label: "All"      },
    { key: "pending",  label: "Pending"  },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total",    value: counts.all,      color: "#374151" },
          { label: "Pending",  value: counts.pending,  color: "#d97706" },
          { label: "Approved", value: counts.approved, color: "#059669" },
          { label: "Rejected", value: counts.rejected, color: "#dc2626" },
        ].map(c => (
          <div key={c.label} style={{
            flex: 1, minWidth: 110,
            background: "#fff", borderRadius: 14, border: "1px solid #e8eaed",
            padding: "16px 20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {c.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginTop: 4, letterSpacing: "-0.5px" }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
        overflow: "hidden",
      }}>
        {/* Filter pills */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #f0f0ee",
          display: "flex", gap: 6, alignItems: "center",
        }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "5px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: "1px solid",
                borderColor: filter === f.key ? "#10b981" : "#e8eaed",
                background:  filter === f.key ? "#ecfdf5" : "#fff",
                color:       filter === f.key ? "#059669" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  background: filter === f.key ? "#059669" : "#f3f4f6",
                  color:      filter === f.key ? "#fff"    : "#374151",
                  borderRadius: 99, padding: "1px 6px",
                }}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0f0ee" }}>
                {["Requester", "Doctor / Org", "Record", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "11px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af" }}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <EmptyState />
              ) : (
                filtered.map((req, i) => {
                  const isActioning = actioningId === req._id;
                  const isPending   = !req.status || req.status === "pending";

                  return (
                    <tr
                      key={req._id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Requester */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
                          {req.requesterName || req.name || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>
                          {req.requesterEmail || req.email || ""}
                        </div>
                      </td>

                      {/* Doctor / Org */}
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>
                        {req.doctorName || req.organization || "—"}
                      </td>

                      {/* Record */}
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "#374151" }}>
                        {req.recordTitle || req.record || "Medical Record"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <StatusBadge status={req.status || "pending"} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px" }}>
                        {isPending ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            {/* Approve */}
                            <button
                              onClick={() => handleAction(req._id, "approved")}
                              disabled={isActioning}
                              style={{
                                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                                background: isActioning ? "#9ca3af" : "#059669",
                                color: "#fff", border: "none",
                                cursor: isActioning ? "not-allowed" : "pointer",
                                transition: "opacity 0.15s",
                              }}
                              onMouseEnter={e => { if (!isActioning) e.currentTarget.style.opacity = "0.85"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                            >
                              {isActioning ? "…" : "Approve"}
                            </button>

                            {/* Reject */}
                            <button
                              onClick={() => handleAction(req._id, "rejected")}
                              disabled={isActioning}
                              style={{
                                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                                background: "#fff", color: "#374151",
                                border: "1px solid #e8eaed",
                                cursor: isActioning ? "not-allowed" : "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={e => {
                                if (isActioning) return;
                                e.currentTarget.style.background   = "#fee2e2";
                                e.currentTarget.style.color        = "#991b1b";
                                e.currentTarget.style.borderColor  = "#fca5a5";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background  = "#fff";
                                e.currentTarget.style.color       = "#374151";
                                e.currentTarget.style.borderColor = "#e8eaed";
                              }}
                            >
                              {isActioning ? "…" : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}