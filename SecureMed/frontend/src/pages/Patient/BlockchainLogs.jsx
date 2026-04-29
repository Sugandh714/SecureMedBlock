import { useState, useEffect } from "react";
import { getLogs } from "../../services/api";

function ChainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  );
}

const ACTION_COLORS = {
  "UPLOAD":         { bg: "#dbeafe", color: "#1d4ed8" },
  "ACCESS_GRANTED": { bg: "#d1fae5", color: "#065f46" },
  "ACCESS_DENIED":  { bg: "#fee2e2", color: "#991b1b" },
  "DELETE":         { bg: "#fef3c7", color: "#92400e" },
  "VERIFY":         { bg: "#ede9fe", color: "#5b21b6" },
};

function getActionStyle(action) {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toUpperCase().includes(k));
  return ACTION_COLORS[key] || { bg: "#f3f4f6", color: "#374151" };
}

/**
 * Normalize whatever shape the backend sends into what LogRow expects:
 * { action, time, actor, detail, hash }
 *
 * Typical backend shapes handled:
 *  - { action, createdAt, performedBy, description, txHash }  (Fabric / custom)
 *  - { action, timestamp, user, details, hash }
 *  - { action, time, actor, detail, hash }                    (already correct)
 */
function normalizeLog(raw) {
  return {
    action: raw.action || raw.event || "UNKNOWN",
    time:   raw.time
              || raw.timestamp
              || (raw.createdAt ? new Date(raw.createdAt).toLocaleString() : "—"),
    actor:  raw.actor
              || raw.user
              || raw.performedBy
              || raw.triggeredBy
              || "System",
    detail: raw.detail
              || raw.details
              || raw.description
              || raw.message
              || "",
    hash:   raw.hash
              || raw.txHash
              || raw.fabricTxId
              || raw.ipfsCid
              || null,
  };
}

function LogRow({ log, isLast }) {
  const style = getActionStyle(log.action);
  return (
    <div
      style={{
        display: "flex", gap: 16,
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid #f9fafb",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Timeline column */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 4, gap: 4, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: style.bg, color: style.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChainIcon />
        </div>
        {!isLast && (
          <div style={{ width: 1, flex: 1, minHeight: 12, background: "#e8eaed" }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            display: "inline-block",
            padding: "3px 10px", borderRadius: 99,
            fontSize: 11, fontWeight: 700,
            background: style.bg, color: style.color,
            letterSpacing: "0.05em",
          }}>
            {log.action}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{log.time}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{log.actor}</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>{log.detail}</div>
        {log.hash && (
          <div style={{
            marginTop: 6, fontSize: 11, color: "#9ca3af", fontFamily: "monospace",
            background: "#f9fafb", borderRadius: 6, padding: "3px 8px",
            display: "inline-block", maxWidth: "100%",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {log.hash}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
      No blockchain logs recorded yet.
    </div>
  );
}

export default function BlockchainLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getLogs()
      .then(res => {
        // Support { data: [...] }, { logs: [...] }, or a raw array
        const raw = Array.isArray(res) ? res : (res.data || res.logs || []);
        setLogs(raw.map(normalizeLog));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const actionCounts = logs.reduce((acc, log) => {
    const key = log.action || "OTHER";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {/* Total */}
        <div style={{
          flex: 1, minWidth: 110,
          background: "#fff", borderRadius: 14, border: "1px solid #e8eaed",
          padding: "16px 20px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Total Events
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111", marginTop: 4, letterSpacing: "-0.5px" }}>
            {loading ? "—" : logs.length}
          </div>
        </div>

        {/* Per-action counts (first 3) */}
        {!loading && Object.entries(actionCounts).slice(0, 3).map(([action, count]) => {
          const s = getActionStyle(action);
          return (
            <div key={action} style={{
              flex: 1, minWidth: 110,
              background: "#fff", borderRadius: 14, border: "1px solid #e8eaed",
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {action}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4, letterSpacing: "-0.5px" }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline card */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #f0f0ee",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#ecfdf5", color: "#059669",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ChainIcon />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Blockchain Activity</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Immutable audit trail of all record events</div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            Loading logs…
          </div>
        ) : error ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#dc2626", fontSize: 13 }}>
            {error}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          logs.map((log, index) => (
            <LogRow key={index} log={log} isLast={index === logs.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}