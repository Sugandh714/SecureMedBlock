import { useState } from "react";

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

const RECORD_TYPES = [
  { value: "Lab Report",   label: "Lab Report"   },
  { value: "Prescription", label: "Prescription" },
  { value: "Imaging",      label: "Imaging"      },
  { value: "Discharge",    label: "Discharge Summary" },
  { value: "Vaccination",  label: "Vaccination Record" },
];

const DEPT_TYPES = [
  { value: "Cardiology",       label: "Cardiology"       },
  { value: "Neurology",        label: "Neurology"         },
  { value: "Radiology",        label: "Radiology"         },
  { value: "General Medicine", label: "General Medicine"  },
];

export default function UploadRecords() {
  const [title,        setTitle]        = useState("");
  const [type,         setType]         = useState("");
  const [file,         setFile]         = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !type) return alert("All fields are required");

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("type",  type);
    formData.append("file",  file);

    try {
      const res  = await fetch("http://localhost:5000/api/records/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploadResult(data.data);
      } else {
        alert("Failed: " + data.message);
      }
    } catch {
      alert("Server error — is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const selectStyle = {
    width: "100%", padding: "10px 14px",
    fontSize: 14, color: "#111",
    background: "#f9fafb", border: "1px solid #e8eaed",
    borderRadius: 10, outline: "none", cursor: "pointer",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", fontSize: 13, fontWeight: 500,
    color: "#374151", marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Upload card */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e8eaed",
        padding: "24px",
      }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
          }}>
            IPFS Encrypted Storage
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Files are encrypted with AES-256 and stored on IPFS. Only you control access.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Drop zone */}
          <div>
            <label style={labelStyle}>Select File (PDF, JPG, PNG)</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
              style={{
                border: `2px dashed ${dragOver ? "#10b981" : file ? "#10b981" : "#e8eaed"}`,
                borderRadius: 12,
                background: dragOver ? "#ecfdf5" : file ? "#f0fdf4" : "#f9fafb",
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#d1fae5", color: "#059669",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckIcon />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ color: "#9ca3af", display: "flex", justifyContent: "center", marginBottom: 10 }}>
                    <UploadIcon />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
                    Drop file here or <span style={{ color: "#059669", textDecoration: "underline" }}>browse</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    PDF, JPG, PNG — Max 10MB
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Record Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. MRI Brain Scan — Jan 2025"
              style={{
                ...selectStyle, cursor: "text",
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

          {/* Type */}
          <div>
            <label style={labelStyle}>Record Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
              <option value="">Select type…</option>
              {RECORD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Dept */}
          <div>
            <label style={labelStyle}>Department</label>
            <select
              onChange={() => {}}
              style={selectStyle}
            >
              <option value="">Select department…</option>
              {DEPT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 11, border: "none",
              background: uploading ? "#9ca3af" : "#111",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.15s",
            }}
          >
            {uploading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                Uploading to IPFS…
              </>
            ) : (
              "Upload File"
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>

      {/* Success result */}
      {uploadResult && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 16, padding: "20px 22px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#d1fae5", color: "#059669",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckIcon />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#059669" }}>
              Upload Successful!
            </div>
          </div>

          {[
            { label: "Title",     value: uploadResult.title    },
            { label: "File",      value: uploadResult.fileName },
          ].map(row => (
            <div key={row.label} style={{
              display: "flex", gap: 10, marginBottom: 8,
              fontSize: 13,
            }}>
              <span style={{ color: "#9ca3af", minWidth: 50 }}>{row.label}</span>
              <span style={{ color: "#111", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>IPFS Link</div>
            <a
              href={uploadResult.ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "#059669", textDecoration: "none",
                fontWeight: 500,
                wordBreak: "break-all",
              }}
            >
              <LinkIcon />
              {uploadResult.ipfsUrl}
            </a>
          </div>

          <div style={{
            marginTop: 10,
            fontFamily: "monospace", fontSize: 11, color: "#9ca3af",
            background: "#fff", borderRadius: 8, padding: "6px 10px",
            border: "1px solid #e8eaed",
          }}>
            CID: {uploadResult.ipfsCid}
          </div>
        </div>
      )}
    </div>
  );
}