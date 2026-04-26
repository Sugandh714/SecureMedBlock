import { useState, useEffect } from "react";
import { getRecords, deleteRecord } from "../../services/api";

/* ── Type config ──────────────────────────────── */
const TYPE_CONFIG = {
  "Lab Report":   { bg: "#dbeafe", color: "#1d4ed8" },
  "Prescription": { bg: "#d1fae5", color: "#065f46" },
  "Imaging":      { bg: "#ede9fe", color: "#5b21b6" },
  "Discharge":    { bg: "#fee2e2", color: "#991b1b" },
  "Vaccination":  { bg: "#ecfdf5", color: "#059669" },
};
const TYPE_FILTERS = ["All", "Lab Report", "Prescription", "Imaging", "Discharge", "Vaccination"];

/* ── Icons ────────────────────────────────────── */
function LabIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M6 2v5L3 12a1 1 0 00.9 1.5h8.2A1 1 0 0013 12L10 7V2"/><path d="M5 2h6"/><circle cx="6.5" cy="10" r=".5" fill="currentColor"/></svg>; }
function RxIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><path d="M6 5.5h4M6 8h4M6 10.5h2"/></svg>; }
function ImgIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><circle cx="5.5" cy="7" r="1"/><path d="M1.5 11l3.5-3 3 2.5 2-1.5 3.5 3"/></svg>; }
function DocIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M10 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5L10 1.5z"/><path d="M10 1.5V5H13.5"/><path d="M5.5 8.5h5M5.5 11h3"/></svg>; }
function VaxIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M10.5 2.5l3 3-1.5 1.5-3-3 1.5-1.5z"/><path d="M9 4L4 9l1.5 1.5 1-1 2 2-1 1L9 14l5-5-2-2 1-1L11 4z"/><path d="M2 14l2-2"/></svg>; }
function SearchIcon(){ return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>; }
function DownloadIcon(){ return <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 16 16" width="14" height="14"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M2.5 12.5h11"/></svg>; }
function TrashIcon(){ return <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 16 16" width="14" height="14"><path d="M3 4h10M6 4V2.5h4V4M5.5 4v8a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V4"/></svg>; }

function TypeIcon({ type }) {
  switch (type) {
    case "Lab Report":   return <LabIcon />;
    case "Prescription": return <RxIcon />;
    case "Imaging":      return <ImgIcon />;
    case "Discharge":    return <DocIcon />;
    case "Vaccination":  return <VaxIcon />;
    default:             return <DocIcon />;
  }
}

/* ── Status badge ─────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Verified: { bg: "#d1fae5", color: "#065f46" },
    Pending:  { bg: "#fef3c7", color: "#92400e" },
    New:      { bg: "#dbeafe", color: "#1d4ed8" },
  };
  const s = map[status] || map.New;
  return (
    <span style={{
      ...s, background: s.bg,
      fontSize: 12, padding: "3px 10px",
      borderRadius: 99, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ── Record card ──────────────────────────────── */
function RecordCard({ record, onDelete }) {
  const cfg  = TYPE_CONFIG[record.type] || TYPE_CONFIG["Lab Report"];
  const date = new Date(record.uploadedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e8eaed",
      borderRadius: 14, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#10b981";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(16,185,129,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TypeIcon type={record.type} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: "#111",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }} title={record.title}>
            {record.title}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {record.type}
          </div>
        </div>
        <StatusBadge status={record.status || "Verified"} />
      </div>

      <div style={{ borderTop: "1px solid #f0f0ee" }} />

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{date}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            title="Download"
            onClick={() => alert(`Download: ${record.title}`)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "1px solid #e8eaed",
              cursor: "pointer", color: "#6b7280", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = "#e8eaed";
            }}
          >
            <DownloadIcon />
          </button>
          <button
            title="Delete"
            onClick={() => {
              if (window.confirm(`Delete "${record.title}"?`)) onDelete(record._id);
            }}
            style={{
              width: 28, height: 28, borderRadius: 7,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "1px solid #e8eaed",
              cursor: "pointer", color: "#6b7280", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.borderColor = "#fca5a5";
              e.currentTarget.style.color = "#991b1b";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = "#e8eaed";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div style={{
      flex: 1, minWidth: 100,
      background: "#fff", border: "1px solid #e8eaed",
      borderRadius: 12, padding: "14px 18px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#111", marginTop: 4, letterSpacing: "-0.5px" }}>
        {value}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────── */
export default function MyRecords() {
  const [records, setRecords] = useState([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");
  const [sort,    setSort]    = useState("date-desc");

  useEffect(() => {
    getRecords().then(res =>
      setRecords((res.data || []).map(r => ({ ...r, status: r.status || "Verified" })))
    );
  }, []);

  const handleDelete = async (id) => {
    await deleteRecord(id);
    setRecords(prev => prev.filter(r => r._id !== id));
  };

  const filtered = records
    .filter(r => {
      const matchType = filter === "All" || r.type === filter;
      const q = search.toLowerCase();
      const matchQ = !q || r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      return matchType && matchQ;
    })
    .sort((a, b) => {
      if (sort === "date-desc") return b.uploadedAt.localeCompare(a.uploadedAt);
      if (sort === "date-asc")  return a.uploadedAt.localeCompare(b.uploadedAt);
      return a.title.localeCompare(b.title);
    });

  const thisYear  = new Date().getFullYear().toString();
  const categories = new Set(records.map(r => r.type)).size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Sub-header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          {records.length} records across {categories} categories
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              color: "#9ca3af", display: "flex", pointerEvents: "none",
            }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search records…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 30, paddingRight: 10, width: 200,
                height: 34, fontSize: 13,
                border: "1px solid #e8eaed", borderRadius: 9,
                background: "#fff", color: "#374151", outline: "none",
              }}
            />
          </div>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              fontSize: 13, padding: "0 10px", height: 34,
              border: "1px solid #e8eaed", borderRadius: 9,
              background: "#fff", color: "#374151", cursor: "pointer",
            }}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatCard label="Total records" value={records.length} />
        <StatCard label="This year"     value={records.filter(r => r.uploadedAt?.startsWith(thisYear)).length} />
        <StatCard label="Verified"      value={records.filter(r => r.status === "Verified").length} />
        <StatCard label="Pending"       value={records.filter(r => r.status === "Pending").length} />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TYPE_FILTERS.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              fontSize: 13, padding: "5px 14px", borderRadius: 99, cursor: "pointer",
              border: "1px solid",
              borderColor: filter === type ? "#10b981" : "#e8eaed",
              background:  filter === type ? "#ecfdf5" : "#fff",
              color:       filter === type ? "#059669" : "#6b7280",
              fontWeight:  filter === type ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1", textAlign: "center",
            padding: "48px 0", fontSize: 14, color: "#9ca3af",
          }}>
            No records found.
          </div>
        ) : (
          filtered.map(record => (
            <RecordCard key={record._id} record={record} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}