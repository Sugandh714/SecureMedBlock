import { NavLink } from "react-router-dom";

function OverviewIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function RecordsIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>; }
function UploadIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>; }
function RequestsIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function LogsIcon()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function SettingsIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }

const NAV_SECTIONS = [
  {
    label: "NAVIGATION",
    items: [
      { label: "Dashboard",       path: "/dashboard/overview",  Icon: OverviewIcon  },
      { label: "My Records",      path: "/dashboard/records",   Icon: RecordsIcon   },
      { label: "Upload Records",  path: "/dashboard/upload",    Icon: UploadIcon    },
    ],
  },
  {
    label: "ACCESS & SECURITY",
    items: [
      { label: "Access Requests", path: "/dashboard/requests",  Icon: RequestsIcon, badgeKey: "requests" },
      { label: "Blockchain Logs", path: "/dashboard/logs",      Icon: LogsIcon,     badgeKey: "logs"     },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Settings",        path: "/dashboard/settings",  Icon: SettingsIcon  },
    ],
  },
];

/** Derive initials from a full name string */
function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * props:
 *  counts   – { records, requests, logs }  from DashboardLayout (live from API)
 *  userName – fetched from getProfile() in DashboardLayout
 *  userRole – fetched from getProfile() in DashboardLayout
 */
export default function Sidebar({ counts = {}, userName = "", userRole = "Verified Patient" }) {
  const initials = getInitials(userName);

  return (
    <aside style={{
      width: 220, minHeight: "100vh",
      background: "#ffffff", borderRight: "1px solid #e8eaed",
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #f0f0ee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: "-0.3px" }}>MedVault</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>Patient Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.08em", padding: "10px 20px 6px",
              textTransform: "uppercase",
            }}>
              {section.label}
            </div>
            {section.items.map(({ label, path, Icon, badgeKey }) => {
              const badge = badgeKey ? counts[badgeKey] : null;
              return (
                <NavLink
                  key={path}
                  to={path}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 20px", margin: "1px 8px", borderRadius: 9,
                    textDecoration: "none", fontSize: 14,
                    fontWeight: isActive ? 600 : 450,
                    color:      isActive ? "#059669" : "#374151",
                    background: isActive ? "#ecfdf5" : "transparent",
                    transition: "all 0.15s",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ color: isActive ? "#059669" : "#6b7280", display: "flex" }}>
                        <Icon />
                      </span>
                      <span style={{ flex: 1 }}>{label}</span>
                      {badge != null && badge > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          background: isActive ? "#059669" : "#f3f4f6",
                          color:      isActive ? "#fff"    : "#374151",
                          borderRadius: 99, padding: "1px 7px", minWidth: 20, textAlign: "center",
                        }}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user chip — name & role from props (API-fetched by DashboardLayout) */}
      <div style={{
        padding: "14px 16px", borderTop: "1px solid #f0f0ee",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #10b981, #0d9488)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 12, fontWeight: 700,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "#111",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {userName || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#10b981" }}>{userRole}</div>
        </div>
      </div>
    </aside>
  );
}