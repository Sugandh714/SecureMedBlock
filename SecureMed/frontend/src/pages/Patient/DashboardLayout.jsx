import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getRecords, getRequests, getProfile } from "../../services/api";

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

const PAGE_TITLES = {
  "/dashboard/overview":  "Dashboard",
  "/dashboard/records":   "My Records",
  "/dashboard/upload":    "Upload Records",
  "/dashboard/requests":  "Access Requests",
  "/dashboard/logs":      "Blockchain Logs",
  "/dashboard/settings":  "Settings",
};

const BREADCRUMB_ACTIONS = {
  "/dashboard/overview": [
    { label: "My Records →",    path: "/dashboard/records" },
    { label: "Security Logs →", path: "/dashboard/logs", primary: true },
  ],
  "/dashboard/records": [
    { label: "Upload New →", path: "/dashboard/upload", primary: true },
  ],
  "/dashboard/requests": [
    { label: "Blockchain Logs →", path: "/dashboard/logs", primary: true },
  ],
};

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [counts,   setCounts]   = useState({ records: 0, requests: 0, logs: 0 });
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("Verified Patient");
  const [search,   setSearch]   = useState("");
  const [hasAlert, setHasAlert] = useState(true);

  useEffect(() => {
    Promise.all([getRecords(), getRequests(), getProfile()])
      .then(([rec, req, profile]) => {
        setCounts({
          records:  (rec?.data  || []).length,
          requests: (req?.data  || []).length,
          logs: 0,
        });
        setUserName(profile?.data?.name || profile?.data?.fullName || "");
        setUserRole(profile?.data?.role || "Verified Patient");
      })
      .catch(err => console.error("Layout fetch error:", err));
  }, []);

  const title    = PAGE_TITLES[location.pathname] || "Dashboard";
  const actions  = BREADCRUMB_ACTIONS[location.pathname] || [];
  const initials = getInitials(userName);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f5f6f8",
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      <Sidebar counts={counts} userName={userName} userRole={userRole} />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <header style={{
          height: 62, background: "#fff", borderBottom: "1px solid #e8eaed",
          display: "flex", alignItems: "center", padding: "0 28px", gap: 16,
          position: "sticky", top: 0, zIndex: 90,
        }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "#9ca3af", display: "flex", pointerEvents: "none",
            }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search records, doctors…"
              style={{
                width: "100%", paddingLeft: 36, paddingRight: 14,
                height: 36, borderRadius: 10, border: "1px solid #e8eaed",
                background: "#f9fafb", fontSize: 13, color: "#374151", outline: "none",
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Bell with red dot when there are pending requests */}
          <button style={{
            position: "relative", width: 36, height: 36, borderRadius: 10,
            border: "1px solid #e8eaed", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#6b7280",
          }}>
            <BellIcon />
            {counts.requests > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 7,
                width: 8, height: 8, borderRadius: "50%",
                background: "#ef4444", border: "1.5px solid #fff",
              }} />
            )}
          </button>

          {/* User — name & role come from getProfile() */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                {userName || "—"}
              </div>
              <div style={{ fontSize: 11, color: "#10b981" }}>{userRole}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 700,
            }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page title strip */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #e8eaed",
          padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.4px" }}>
              {title}
            </h1>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0" }}>{today}</p>
          </div>
          {actions.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              {actions.map(a => (
                <button key={a.path} onClick={() => navigate(a.path)} style={{
                  padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", border: "none",
                  background: a.primary ? "#111" : "#f3f4f6",
                  color:      a.primary ? "#fff" : "#374151",
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Security alert — overview only */}
        {hasAlert && location.pathname === "/dashboard/overview" && (
          <div style={{
            margin: "20px 28px 0",
            background: "#fff5f5", border: "1px solid #fecaca",
            borderRadius: 12, padding: "13px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>
                Unauthorized access attempt detected
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                IP 192.168.4.21 — 7 failed login attempts at 09:31 AM. Account temporarily locked.
              </div>
            </div>
            <button onClick={() => setHasAlert(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", fontSize: 20, lineHeight: 1, padding: 4,
            }}>×</button>
          </div>
        )}

        <main style={{ flex: 1, padding: "24px 28px 40px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}