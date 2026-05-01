import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Bell, AlertTriangle, FileText, Shield,
  History, User, LogOut, Search, RefreshCw, Eye,
  Clock, CheckCircle, XCircle, ChevronRight, Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfile, discoverRecords, getMyRequests, fetchRecord, createRequest, getLogs } from "../../services/api";
import { logout } from "../../services/auth";

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
const STATUS_PILL = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function Pill({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_PILL[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "unknown"}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

function Empty({ message = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FileText className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">×</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Medical Records (discover + request access)
// ---------------------------------------------------------------------------
function RecordsTab() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [requested, setRequested] = useState({}); // recordId → "pending"|"done"|"error"

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await discoverRecords({ query: query.trim() });
      setResults(res.data || res.records || []);
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (record) => {
    setRequested(prev => ({ ...prev, [record._id]: "pending" }));
    try {
      await createRequest({
        recordId:   record._id,
        patientId:  record.patientId || record.owner,
        recordTitle: record.title,
      });
      setRequested(prev => ({ ...prev, [record._id]: "done" }));
    } catch (err) {
      setRequested(prev => ({ ...prev, [record._id]: "error" }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by patient name, email, or medical ID…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Results */}
      {loading ? <Spinner /> : results.length === 0 && !error ? (
        <Empty message="Search for a patient above to discover their records." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Record", "Patient", "Type", "Department", "Date", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((rec, i) => {
                const state = requested[rec._id];
                return (
                  <tr key={rec._id} className={`border-b last:border-0 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                    <td className="px-5 py-4 font-medium text-gray-800 text-sm">{rec.title || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{rec.patientName || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{rec.type || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{rec.department || "—"}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {state === "done" ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Requested
                        </span>
                      ) : state === "error" ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequestAccess(rec)}
                          disabled={state === "pending"}
                          className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {state === "pending" ? "Requesting…" : "Request Access"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecordViewer — shown when an approved request is "fetched"
// ---------------------------------------------------------------------------
function RecordViewer({ data, onClose }) {
  // data is whatever the backend returns — could be { content, mimeType, fileName }
  const isText = !data.mimeType || data.mimeType.startsWith("text");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">{data.fileName || "Medical Record"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{data.mimeType || "Unknown type"}</p>
          </div>
          <div className="flex items-center gap-3">
            {data.content && (
              <a
                href={`data:${data.mimeType || "application/octet-stream"};base64,${data.content}`}
                download={data.fileName || "record"}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {isText && data.content ? (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {atob(data.content)}
            </pre>
          ) : data.mimeType?.startsWith("image") && data.content ? (
            <img
              src={`data:${data.mimeType};base64,${data.content}`}
              alt="Medical record"
              className="max-w-full mx-auto rounded-lg"
            />
          ) : data.mimeType === "application/pdf" && data.content ? (
            <iframe
              src={`data:application/pdf;base64,${data.content}`}
              className="w-full h-[60vh] rounded-lg border"
              title="Medical record PDF"
            />
          ) : (
            <div className="text-center text-gray-400 py-10">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Preview not available — use the Download button above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: My Access Requests
// ---------------------------------------------------------------------------
function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [fetching, setFetching] = useState({}); // requestId → bool
  const [viewer,   setViewer]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyRequests();
      setRequests(res.data || res.requests || []);
    } catch (err) {
      setError(err.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFetch = async (req) => {
    setFetching(prev => ({ ...prev, [req._id]: true }));
    try {
      const res = await fetchRecord(req._id);
      setViewer(res.data || res);
    } catch (err) {
      // surface fetch error inline on the row
      setFetching(prev => ({ ...prev, [req._id]: "error" }));
    } finally {
      setFetching(prev => ({ ...prev, [req._id]: false }));
    }
  };

  return (
    <div className="space-y-5">
      {viewer && <RecordViewer data={viewer} onClose={() => setViewer(null)} />}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">All access requests you have submitted.</p>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? <Spinner /> : requests.length === 0 ? (
        <Empty message="You haven't submitted any access requests yet." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Record", "Patient", "Requested On", "Status", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req, i) => {
                const isFetching = fetching[req._id] === true;
                const fetchErr   = fetching[req._id] === "error";
                return (
                  <tr key={req._id} className={`border-b last:border-0 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                    <td className="px-5 py-4 font-medium text-gray-800 text-sm">
                      {req.recordTitle || req.record || "Medical Record"}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {req.patientName || req.requesterName || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Pill status={req.status} />
                    </td>
                    <td className="px-5 py-4">
                      {req.status === "approved" ? (
                        fetchErr ? (
                          <span className="text-xs text-red-600 font-medium">Fetch failed</span>
                        ) : (
                          <button
                            onClick={() => handleFetch(req)}
                            disabled={isFetching}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isFetching ? "Opening…" : "View Record"}
                          </button>
                        )
                      ) : req.status === "pending" ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> Awaiting approval
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Activity Logs
// ---------------------------------------------------------------------------
function LogsTab() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getLogs()
      .then(res => setLogs(res.data || res.logs || []))
      .catch(err => setError(err.message || "Failed to load logs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      {loading ? <Spinner /> : logs.length === 0 ? (
        <Empty message="No activity logged yet." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 divide-y">
          {logs.map((log, i) => (
            <div key={log._id || i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <History className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{log.action || log.event || "Event"}</p>
                {log.details && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.details}</p>}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap mt-1">
                {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DoctorDashboard
// ---------------------------------------------------------------------------
const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [doctor,    setDoctor]    = useState({ name: "", specialty: "", hospital: "" });

  const navigate = useNavigate();

  useEffect(() => {
    getProfile()
      .then(res => {
        const d = res?.data || {};
        setDoctor({
          name:      d.name              || "Doctor",
          specialty: d.specialization    || d.specialty || "",
          hospital:  d.hospital          || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => logout(navigate);

  const doctorInitial = doctor.name?.trim().slice(-1).toUpperCase() || "D";

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard",       icon: Users         },
    { id: "records",   label: "Medical Records", icon: FileText      },
    { id: "requests",  label: "My Requests",     icon: Shield        },
    { id: "emergency", label: "Emergency Access",icon: AlertTriangle },
    { id: "logs",      label: "Activity Logs",   icon: History       },
    { id: "profile",   label: "My Profile",      icon: User          },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">🩺</div>
            <div>
              <h1 className="text-xl font-bold">SecureMed</h1>
              <p className="text-sm text-gray-500">Doctor Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile + logout */}
        <div className="p-4 border-t space-y-1">
          <div className="flex items-center gap-3 p-3 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {doctorInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{doctor.name || "—"}</p>
              <p className="text-xs text-gray-500 truncate">
                {[doctor.specialty, doctor.hospital].filter(Boolean).join(" • ") || "Doctor"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold capitalize">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || activeTab}
          </h2>
          <div className="flex items-center gap-6">
            <Bell className="w-6 h-6 text-gray-500" />
            <div className="text-right">
              <p className="font-medium text-sm">{doctor.name || "—"}</p>
              <p className="text-xs text-gray-500">Welcome back 👋</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">

          {/* ─ Dashboard overview ─ */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    label: "Medical Records",
                    desc:  "Search & request access to patient records",
                    icon:  FileText,
                    tab:   "records",
                    color: "text-blue-600",
                    bg:    "bg-blue-50",
                  },
                  {
                    label: "My Requests",
                    desc:  "Track access requests you've submitted",
                    icon:  Shield,
                    tab:   "requests",
                    color: "text-purple-600",
                    bg:    "bg-purple-50",
                  },
                  {
                    label: "Activity Logs",
                    desc:  "View your recent actions and events",
                    icon:  History,
                    tab:   "logs",
                    color: "text-green-600",
                    bg:    "bg-green-50",
                  },
                ].map(card => (
                  <button
                    key={card.tab}
                    onClick={() => setActiveTab(card.tab)}
                    className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-100 text-left hover:shadow-md transition-shadow group"
                  >
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
                    <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Go to {card.label} <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-700 mb-1">Quick tips</h3>
                <ul className="text-sm text-gray-500 space-y-1.5 list-disc list-inside">
                  <li>Use <strong>Medical Records</strong> to search for a patient and request access to their records.</li>
                  <li>Check <strong>My Requests</strong> to see if a patient has approved your request — then click <em>View Record</em>.</li>
                  <li>Once a request is approved the record is decrypted server-side and streamed back — it is never stored in the browser.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ─ Medical Records tab ─ */}
          {activeTab === "records" && <RecordsTab />}

          {/* ─ My Requests tab ─ */}
          {activeTab === "requests" && <RequestsTab />}

          {/* ─ Logs tab ─ */}
          {activeTab === "logs" && <LogsTab />}

          {/* ─ Profile tab ─ */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-8 max-w-2xl">
              <h2 className="text-xl font-bold mb-6 text-gray-800">My Profile</h2>
              <div className="flex gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {doctorInitial}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-800">{doctor.name || "—"}</p>
                  <p className="text-gray-500">{doctor.specialty}</p>
                  <p className="text-gray-400 text-sm">{doctor.hospital}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}

          {/* ─ Emergency (placeholder) ─ */}
          {activeTab === "emergency" && (
            <div className="bg-white p-10 text-center rounded-2xl ring-1 ring-slate-100 shadow-sm">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Emergency access is coming soon.</p>
              <p className="text-sm text-gray-400 mt-1">This will allow override access for critical situations with mandatory audit logging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;