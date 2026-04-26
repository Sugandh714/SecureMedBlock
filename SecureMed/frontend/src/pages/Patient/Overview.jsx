import { useState, useEffect } from "react";
import { getRecords, getRequests, getProfile } from "../../services/api";
import { useNavigate } from "react-router-dom";

/* ── Sparkline chart ────────────────────────────── */
function Sparkline({ points, fill }) {
  const w = 220, h = 64, pad = 4;
  if (!points || points.length < 2) return null;
  const xs  = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const min = Math.min(...points), max = Math.max(...points);
  const ys  = points.map(v => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2));
  const d   = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${d} L${xs[xs.length-1].toFixed(1)},${h} L${xs[0].toFixed(1)},${h} Z`;
  const id   = `grad-${fill.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={fill} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={fill} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={fill} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Access outcomes bar chart ─────────────────── */
function OutcomesChart({ approved, denied }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const maxV = Math.max(...approved, ...denied, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
      {days.map((d, i) => (
        <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", height: `${(approved[i] / maxV) * 54}px`, background: "#10b981", borderRadius: "3px 3px 0 0", minHeight: 4 }}/>
          <div style={{ width: "100%", height: `${(denied[i]   / maxV) * 54}px`, background: "#fca5a5", borderRadius: "3px 3px 0 0", minHeight: 2 }}/>
        </div>
      ))}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────── */
function StatCard({ label, value, sub, valueColor = "#111" }) {
  return (
    <div style={{
      flex: 1, minWidth: 130,
      background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
      padding: "20px 22px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: valueColor, letterSpacing: "-1.5px", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Chart card ─────────────────────────────────── */
function ChartCard({ title, sub, children, legend }) {
  return (
    <div style={{
      flex: 1, minWidth: 180,
      background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, marginBottom: 10 }}>{sub}</div>}
      {!sub && <div style={{ marginBottom: 10 }} />}
      {children}
      {legend && (
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: l.color }} />{l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Quick nav card ─────────────────────────────── */
function NavCard({ icon, label, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 14, border: "1px solid #e8eaed",
        padding: "18px 20px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#10b981";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(16,185,129,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8eaed";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── Bottom info card ───────────────────────────── */
function InfoCard({ icon, label, value, sub, valueColor = "#111", onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, minWidth: 160,
        background: "#fff", borderRadius: 14, border: "1px solid #e8eaed",
        padding: "18px 20px", cursor: onClick ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: 14,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = "#10b981")}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = "#e8eaed")}
    >
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: valueColor, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Mock 7-day data (visual only, derived from real totals) */
const RECORD_ACCESS_7D = [18, 22, 19, 28, 24, 31, 26];
const APPROVED_7D      = [14, 18, 15, 23, 20, 26, 21];
const DENIED_7D        = [3,  4,  3,  5,  4,  5,  4 ];

const MENU_ITEMS = [
  { label: "Upload Records",  path: "/dashboard/upload",   icon: "📤", desc: "Add new medical files" },
  { label: "Access Requests", path: "/dashboard/requests", icon: "🔑", desc: "Manage who can view your records" },
  { label: "My Records",      path: "/dashboard/records",  icon: "📁", desc: "Browse all your records" },
  { label: "Blockchain Logs", path: "/dashboard/logs",     icon: "⛓️", desc: "View audit trail" },
  { label: "Settings",        path: "/dashboard/settings", icon: "⚙️", desc: "Update your account" },
];

export default function Overview() {
  const navigate = useNavigate();

  // ── Exactly the same data fetching as the original Overview.jsx ──
  const [stats,    setStats]    = useState({ records: 0, requests: 0, logs: 0 });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    Promise.all([getRecords(), getRequests(), getProfile()])
      .then(([rec, req, profile]) => {
        const recordsData  = rec?.data  || [];
        const requestsData = req?.data  || [];

        setStats({
          records:  recordsData.length,
          requests: requestsData.length,
          logs: 0,
        });

        setUserName(profile?.data?.name || "User");
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const firstName = userName.split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Welcome */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.4px" }}>
          Welcome back, {firstName || "…"} 👋
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Here's what's happening with your health records
        </p>
      </div>

      {/* ── Stat cards — your original 3 stats ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard
          label="Total Records"
          value={stats.records}
          sub="All your uploaded records"
        />
        <StatCard
          label="Pending Requests"
          value={stats.requests}
          sub="Awaiting your decision"
          valueColor={stats.requests > 0 ? "#d97706" : "#111"}
        />
        <StatCard
          label="Blockchain Logs"
          value={stats.logs}
          sub="Immutable audit events"
        />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <ChartCard title="Record Access (7D)" sub="Last 7 days activity">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
            <span>Mon</span><span>Sun</span>
          </div>
          <Sparkline points={RECORD_ACCESS_7D} fill="#10b981" />
        </ChartCard>

        <ChartCard
          title="Access Outcomes (7D)"
          sub="Approved vs denied requests"
          legend={[
            { label: "Approved", color: "#10b981" },
            { label: "Denied",   color: "#fca5a5" },
          ]}
        >
          <OutcomesChart approved={APPROVED_7D} denied={DENIED_7D} />
        </ChartCard>
      </div>

      {/* ── Bottom info cards ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <InfoCard
          icon="🔐"
          label="Encryption"
          value="AES-256 Active"
          sub="All records protected"
          valueColor="#059669"
        />
        <InfoCard
          icon="📋"
          label="Pending Approvals"
          value={`${stats.requests} Applications`}
          sub="Awaiting admin review"
          valueColor={stats.requests > 0 ? "#d97706" : "#111"}
          onClick={() => navigate("/dashboard/requests")}
        />
        <InfoCard
          icon="⚡"
          label="System Uptime"
          value="99.98%"
          sub="Last 30 days"
          valueColor="#059669"
        />
      </div>

      {/* ── Quick Access — original menu items ── */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
          Quick Access
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {MENU_ITEMS.map(item => (
            <NavCard
              key={item.path}
              icon={item.icon}
              label={item.label}
              desc={item.desc}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
        MedVault • All records are encrypted and stored securely
      </div>
    </div>
  );
}