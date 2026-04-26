import { useState } from "react";

function InputField({ label, type = "text", defaultValue, placeholder }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 500,
        color: "#374151", marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px",
          fontSize: 14, color: "#111",
          background: "#f9fafb",
          border: "1px solid #e8eaed",
          borderRadius: 10, outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onFocus={e => {
          e.target.style.background = "#fff";
          e.target.style.borderColor = "#10b981";
        }}
        onBlur={e => {
          e.target.style.background = "#f9fafb";
          e.target.style.borderColor = "#e8eaed";
        }}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
      padding: "22px 24px",
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: "0.07em",
        marginBottom: 18,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Profile header */}
      <Section title="Profile">
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #10b981, #0d9488)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 22, fontWeight: 700,
          }}>
            NS
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>user</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>user@gmail.com</div>
            <div style={{
              display: "inline-block", marginTop: 6,
              padding: "3px 10px", borderRadius: 99,
              fontSize: 12, fontWeight: 600,
              background: "#d1fae5", color: "#065f46",
            }}>
              ✓ Verified Patient
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InputField label="Full Name" defaultValue="user" />
          <InputField label="Email Address" type="email" defaultValue="user@gmail.com" />
          <InputField label="Phone Number" defaultValue="+91 98765 43210" />
        </div>
      </Section>

      {/* Password section */}
      <Section title="Security">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InputField label="Current Password" type="password" placeholder="Enter current password" />
          <InputField label="New Password"      type="password" placeholder="Enter new password" />
          <InputField label="Confirm Password"  type="password" placeholder="Confirm new password" />
        </div>
      </Section>

      {/* Notifications section */}
      <Section title="Notifications">
        {[
          { label: "Access request alerts",    sub: "Get notified when someone requests your records"  },
          { label: "Blockchain confirmations", sub: "Receive alerts for blockchain record verifications" },
          { label: "Security warnings",        sub: "Be alerted about suspicious account activity"      },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: i < 2 ? "1px solid #f9fafb" : "none",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.sub}</div>
            </div>
            <label style={{ position: "relative", display: "inline-flex", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
              <div style={{
                width: 40, height: 22, background: "#10b981", borderRadius: 99,
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  position: "absolute", top: 3, left: 21, width: 16, height: 16,
                  background: "#fff", borderRadius: "50%",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
            </label>
          </div>
        ))}
      </Section>

      {/* Save button */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: "12px", borderRadius: 11, border: "none",
            background: saved ? "#059669" : "#111",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Changes Saved" : "Save Changes"}
        </button>
        <button style={{
          padding: "12px 20px", borderRadius: 11,
          border: "1px solid #e8eaed", background: "#fff",
          color: "#374151", fontSize: 14, cursor: "pointer",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}