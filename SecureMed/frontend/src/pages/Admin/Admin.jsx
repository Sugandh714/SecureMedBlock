import { useState, useEffect } from "react"

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const INIT_PATIENTS = [
  { id: "P-0041", name: "Aanya Mehta", age: 34, gender: "F", doctor: "Dr. Arvind Rajan", status: "Active", consent: true },
  { id: "P-0042", name: "Rohan Verma", age: 58, gender: "M", doctor: "Dr. Sunita Nair", status: "Active", consent: false },
  { id: "P-0043", name: "Priya Kapoor", age: 27, gender: "F", doctor: "Dr. Kiran Sharma", status: "Inactive", consent: true },
  { id: "P-0044", name: "Vikram Singh", age: 45, gender: "M", doctor: "Dr. Arvind Rajan", status: "Active", consent: true },
  { id: "P-0045", name: "Meera Pillai", age: 61, gender: "F", doctor: "Dr. Sunita Nair", status: "Active", consent: true },
];
const INIT_DOCTORS = [
  { id: "D-101", name: "Dr. Arvind Rajan", spec: "Cardiology", dept: "Cardiology", patients: 14, status: "Active", email: "rajan@hospital.in", phone: "9876543210", license: "MCI-2891" },
  { id: "D-102", name: "Dr. Sunita Nair", spec: "Neurology", dept: "Neurology", patients: 9, status: "Active", email: "nair@hospital.in", phone: "9876543211", license: "MCI-3012" },
  { id: "D-103", name: "Dr. Kiran Sharma", spec: "Orthopaedics", dept: "Surgery", patients: 11, status: "On Leave", email: "sharma@hospital.in", phone: "9876543212", license: "MCI-2754" },
  { id: "D-104", name: "Dr. Fatima Zaidi", spec: "Oncology", dept: "Oncology", patients: 7, status: "Active", email: "zaidi@hospital.in", phone: "9876543213", license: "MCI-3198" },
];
const INIT_APPLICATIONS = [
  { id: "APP-001", name: "Dr. Rohan Mehta", spec: "Dermatology", dept: "Skin & Hair", email: "r.mehta@gmail.com", phone: "9988776655", license: "MCI-4501", experience: "6 years", submitted: "2026-03-25", status: "Pending" },
  { id: "APP-002", name: "Dr. Priya Iyer", spec: "Gynaecology", dept: "Women Health", email: "p.iyer@medcorp.in", phone: "9988776644", license: "MCI-4502", experience: "9 years", submitted: "2026-03-26", status: "Pending" },
  { id: "APP-003", name: "Dr. Amit Kulkarni", spec: "Psychiatry", dept: "Mental Health", email: "a.kulk@docmail.in", phone: "9988776633", license: "MCI-4503", experience: "4 years", submitted: "2026-03-27", status: "Pending" },
];
const INIT_RECORDS = [
  { id: "R-9001", patient: "Aanya Mehta", type: "X-Ray", by: "Dr. Rajan", date: "2025-03-21", encrypted: true },
  { id: "R-9002", patient: "Rohan Verma", type: "Prescription", by: "Dr. Nair", date: "2025-03-22", encrypted: true },
  { id: "R-9003", patient: "Priya Kapoor", type: "Blood Report", by: "Dr. Sharma", date: "2025-03-23", encrypted: false },
  { id: "R-9004", patient: "Vikram Singh", type: "MRI Scan", by: "Dr. Rajan", date: "2025-03-24", encrypted: true },
];
const INIT_ACCESS = [
  { id: "A-001", user: "Dr. Fatima Zaidi", role: "Doctor", record: "P-0042 Rohan Verma", reason: "Second opinion on MRI", type: "Normal", status: "Pending" },
  { id: "A-002", user: "Nurse Rekha Patil", role: "Nurse", record: "P-0041 Aanya Mehta", reason: "Post-op monitoring", type: "Emergency", status: "Pending" },
  { id: "A-003", user: "Dr. Kiran Sharma", role: "Doctor", record: "P-0044 Vikram Singh", reason: "Pre-surgical review", type: "Normal", status: "Approved" },
  { id: "A-004", user: "External Lab", role: "External", record: "P-0043 Priya Kapoor", reason: "Lab analysis request", type: "Normal", status: "Denied" },
];
const INIT_EMERGENCY = [
  { id: "E-01", triggeredBy: "Dr. Fatima Zaidi", patient: "Vikram Singh (P-0044)", duration: "2h", time: "2026-03-28 23:10", active: true },
  { id: "E-02", triggeredBy: "Admin Override", patient: "Meera Pillai (P-0045)", duration: "1h", time: "2026-03-27 03:45", active: false },
];
const INIT_LOGS = [
  { id: 1, user: "Dr. Arvind Rajan", action: "Viewed Record", record: "R-9001", time: "2026-03-29 09:14", status: "Success" },
  { id: 2, user: "Unknown — 192.168.4.21", action: "Login Attempt", record: "—", time: "2026-03-29 09:31", status: "Denied" },
  { id: 3, user: "Admin Singh", action: "Deleted Record", record: "R-9003", time: "2026-03-29 10:02", status: "Success" },
  { id: 4, user: "Nurse Rekha Patil", action: "Viewed Record", record: "R-9004", time: "2026-03-29 10:45", status: "Denied" },
  { id: 5, user: "Dr. Sunita Nair", action: "Downloaded Record", record: "R-9002", time: "2026-03-29 11:20", status: "Success" },
];
const SPECS = ["Cardiology", "Neurology", "Orthopaedics", "Oncology", "Dermatology", "Gynaecology", "Psychiatry", "General Medicine", "Paediatrics", "Radiology"];
const DEPTS = ["Cardiology", "Neurology", "Surgery", "Oncology", "Skin & Hair", "Women Health", "Mental Health", "General", "Paediatrics", "Radiology"];
const ACTION_ICON = { "Viewed Record": "👁", "Login Attempt": "🔑", "Deleted Record": "🗑️", "Downloaded Record": "📥" };
const TYPE_PILL = { "X-Ray": "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100", "Prescription": "bg-teal-50 text-teal-700 ring-1 ring-teal-100", "Blood Report": "bg-amber-50 text-amber-700 ring-1 ring-amber-100", "MRI Scan": "bg-purple-50 text-purple-700 ring-1 ring-purple-100" };

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const Badge = ({ label, color = "gray" }) => {
  const s = { green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", red: "bg-red-50 text-red-600 ring-1 ring-red-200", yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", gray: "bg-slate-100 text-slate-500 ring-1 ring-slate-200", teal: "bg-teal-50 text-teal-700 ring-1 ring-teal-200", purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${s[color] || s.gray}`}>{label}</span>;
};
const Pill = ({ v }) => {
  if (["Active", "Approved", "Success"].includes(v)) return <Badge label={v} color="green" />;
  if (["Denied", "Inactive", "Suspended"].includes(v)) return <Badge label={v} color="red" />;
  if (["Pending"].includes(v)) return <Badge label={v} color="yellow" />;
  if (["On Leave"].includes(v)) return <Badge label={v} color="purple" />;
  return <Badge label={v} color="gray" />;
};
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-600 text-xl leading-none transition-colors">✕</button>
      </div>
      <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);
const Lbl = ({ children, req }) => <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{children}{req && <span className="text-rose-400 ml-0.5">*</span>}</label>;
const Inp = (p) => <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-slate-300 bg-white transition-all" />;
const Sel = ({ children, ...p }) => <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white transition-all">{children}</select>;
const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? "bg-teal-500" : "bg-slate-200"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : ""}`} />
  </button>
);
const TH = ({ cols }) => (
  <thead>
    <tr className="bg-slate-50 border-b border-slate-100">
      {cols.map(c => <th key={c} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{c}</th>)}
    </tr>
  </thead>
);
const TR = ({ children, i = 0 }) => <tr className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 === 1 ? "bg-slate-50/30" : ""}`}>{children}</tr>;
const TD = ({ children, mono }) => <td className={`px-4 py-3 text-sm ${mono ? "font-mono text-xs text-slate-400" : "text-slate-700"}`}>{children}</td>;
const IBtn = ({ title, onClick, danger, children }) => (
  <button title={title} onClick={onClick} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all text-sm ${danger ? "text-slate-300 hover:bg-rose-50 hover:text-rose-500" : "text-slate-300 hover:bg-slate-100 hover:text-slate-600"}`}>{children}</button>
);
const TCard = ({ children }) => <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">{children}</div>;
const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-6 w-fit flex-wrap">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${active === t.id ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
        <span>{t.icon}</span>{t.label}
        {t.badge > 0 && <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{t.badge}</span>}
      </button>
    ))}
  </div>
);
const PageHeader = ({ title, sub, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div><h2 className="text-lg font-bold text-slate-800">{title}</h2>{sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}</div>
    {action}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════
const StatCard = ({ icon, label, value, delta, color }) => {
  const p = { blue: { r: "ring-blue-100", b: "bg-blue-50", t: "text-blue-600" }, teal: { r: "ring-teal-100", b: "bg-teal-50", t: "text-teal-600" }, indigo: { r: "ring-indigo-100", b: "bg-indigo-50", t: "text-indigo-600" }, amber: { r: "ring-amber-100", b: "bg-amber-50", t: "text-amber-600" }, rose: { r: "ring-rose-100", b: "bg-rose-50", t: "text-rose-600" } };
  const c = p[color] || p.blue;
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${c.b} ring-1 ${c.r} flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p><p className={`text-2xl font-bold mt-0.5 ${c.t}`}>{value}</p>{delta && <p className="text-[11px] text-slate-400 mt-0.5">{delta}</p>}</div>
    </div>
  );
};
const Sparkline = ({ data = [], label, color = "#0d9488" }) => {
  const H = 52, W = 220, max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - ((v - min) / range) * (H - 10) - 5]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = [`0,${H}`, ...pts.map(([x, y]) => `${x},${y}`), `${W},${H}`].join(" ");
  const gid = `g${label.replace(/\W/g, "")}`;
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color} />)}
      </svg>
      <div className="flex justify-between mt-1"><span className="text-[9px] text-slate-300">Mon</span><span className="text-[9px] text-slate-300">Sun</span></div>
    </div>
  );
};
const BarChart = ({ approved = [], denied = [], label }) => {
  const max = Math.max(...approved, ...denied) || 1;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
      <div className="flex items-end gap-1.5 h-20">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 64 }}>
              <div className="flex-1 rounded-t-sm bg-teal-400 hover:bg-teal-500 transition-colors" style={{ height: `${(approved[i] / max) * 64}px` }} />
              <div className="flex-1 rounded-t-sm bg-rose-300 hover:bg-rose-400 transition-colors" style={{ height: `${(denied[i] / max) * 64}px` }} />
            </div>
            <span className="text-[9px] text-slate-300 font-medium">{d}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-400 inline-block" />Approved</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-rose-300 inline-block" />Denied</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE 1 — DASHBOARD
// ═══════════════════════════════════════════════════════════════
const PageDashboard = ({ setPage }) => {
  const [alert, setAlert] = useState(true);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-slate-800">Dashboard</h1><p className="text-xs text-slate-400 mt-0.5">System overview — Sunday, 29 March 2026</p></div>
        <div className="flex gap-2">
          <button onClick={() => setPage("people")} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-teal-300 hover:text-teal-700 transition-all">People & Records →</button>
          <button onClick={() => setPage("security")} className="text-xs font-semibold px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm">Security Ops →</button>
        </div>
      </div>
      {alert && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">🚨</div>
          <div className="flex-1"><p className="text-sm font-semibold text-rose-700">Unauthorized access attempt detected</p><p className="text-xs text-rose-500 mt-0.5">IP 192.168.4.21 — 7 failed login attempts at 09:31 AM. Account temporarily locked.</p></div>
          <button onClick={() => setAlert(false)} className="text-rose-300 hover:text-rose-500 transition-colors">✕</button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon="👥" label="Total Patients" value="1,284" delta="+12 this week" color="blue" />
        <StatCard icon="🩺" label="Total Doctors" value="86" delta="4 on leave" color="teal" />
        <StatCard icon="📁" label="Active Records" value="3,541" delta="98% encrypted" color="indigo" />
        <StatCard icon="🔐" label="Pending Consents" value="14" delta="3 emergency" color="amber" />
        <StatCard icon="🚨" label="Security Alerts" value="2" delta="Since midnight" color="rose" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Sparkline label="Record Access (7d)" data={[42, 55, 49, 70, 63, 80, 74]} color="#0d9488" />
        <Sparkline label="Registrations (7d)" data={[5, 8, 6, 11, 9, 14, 7]} color="#3b82f6" />
        <BarChart label="Access Outcomes (7d)" approved={[8, 12, 7, 15, 10, 13, 9]} denied={[3, 2, 5, 1, 4, 2, 3]} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ icon: "🔒", label: "Encryption", val: "AES-256 Active", sub: "All records protected", color: "text-emerald-600" },
        { icon: "📋", label: "Pending Approvals", val: "3 Applications", sub: "Awaiting admin review", color: "text-amber-600" },
        { icon: "🏥", label: "System Uptime", val: "99.98%", sub: "Last 30 days", color: "text-blue-600" }
        ].map(({ icon, label, val, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-sm flex items-center gap-4">
            <span className="text-2xl">{icon}</span>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p><p className={`text-base font-bold mt-0.5 ${color}`}>{val}</p><p className="text-[11px] text-slate-400">{sub}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE 2 — PEOPLE & RECORDS
// ═══════════════════════════════════════════════════════════════

const TabPatients = () => {
  const [rows, setRows] = useState(INIT_PATIENTS);
  const [view, setView] = useState(null);
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ name: "", age: "", gender: "M", doctor: "", status: "Active" });
  const toggle = id => setRows(r => r.map(p => p.id === id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p));
  const handleAdd = () => {
    if (!f.name || !f.age || !f.doctor) return;
    setRows(r => [...r, { ...f, id: `P-00${50 + r.length}`, age: parseInt(f.age), consent: false }]);
    setAdd(false); setF({ name: "", age: "", gender: "M", doctor: "", status: "Active" });
  };
  return (
    <div>
      <PageHeader title="Patient Management" sub={`${rows.length} patients registered`}
        action={<button onClick={() => setAdd(true)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm">+ Add Patient</button>} />
      <TCard>
        <table className="w-full">
          <TH cols={["Patient ID", "Name", "Doctor", "Status", "Consent", "Actions"]} />
          <tbody>{rows.map((p, i) => (
            <TR key={p.id} i={i}>
              <TD mono>{p.id}</TD>
              <TD><div className="font-semibold text-slate-800">{p.name}</div><div className="text-[11px] text-slate-400">{p.age} yrs · {p.gender}</div></TD>
              <TD>{p.doctor}</TD>
              <TD><Pill v={p.status} /></TD>
              <TD>{p.consent ? <Badge label="Granted" color="green" /> : <Badge label="Revoked" color="red" />}</TD>
              <td className="px-4 py-3"><div className="flex items-center gap-1">
                <IBtn title="View" onClick={() => setView(p)}>👁</IBtn>
                <IBtn title="Edit">✏️</IBtn>
                <IBtn title="Consent Logs">📜</IBtn>
                <IBtn title="Toggle Status" danger onClick={() => toggle(p.id)}>🚫</IBtn>
              </div></td>
            </TR>
          ))}</tbody>
        </table>
      </TCard>
      {view && <Modal title={`Patient — ${view.name}`} onClose={() => setView(null)}>
        <div className="space-y-3 text-sm">
          {[["ID", view.id], ["Age / Gender", `${view.age} / ${view.gender}`], ["Assigned Doctor", view.doctor]].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-slate-400">{k}</span><span className="font-medium text-slate-800">{v}</span></div>
          ))}
          <div className="flex justify-between"><span className="text-slate-400">Status</span><Pill v={view.status} /></div>
          <div className="flex justify-between"><span className="text-slate-400">Consent</span>{view.consent ? <Badge label="Granted" color="green" /> : <Badge label="Revoked" color="red" />}</div>
        </div>
        <button onClick={() => setView(null)} className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">Close</button>
      </Modal>}
      {add && <Modal title="Register New Patient" onClose={() => setAdd(false)}>
        <div className="space-y-3">
          <div><Lbl req>Full Name</Lbl><Inp placeholder="Patient full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl req>Age</Lbl><Inp type="number" placeholder="Age" value={f.age} onChange={e => setF({ ...f, age: e.target.value })} /></div>
            <div><Lbl>Gender</Lbl><Sel value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })}><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></Sel></div>
          </div>
          <div><Lbl req>Assigned Doctor</Lbl><Sel value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })}><option value="">Select doctor…</option>{INIT_DOCTORS.map(d => <option key={d.id}>{d.name}</option>)}</Sel></div>
          <div><Lbl>Status</Lbl><Sel value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></Sel></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setAdd(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">Register Patient</button>
        </div>
      </Modal>}
    </div>
  );
};





const TabDoctors = () => {
  const [rows, setRows] = useState(INIT_DOCTORS);
  const [apps, setApps] = useState(INIT_APPLICATIONS);
  const [sub, setSub] = useState("active");
  const [view, setView] = useState(null);
  const [appA, setAppA] = useState(null);
  const [appR, setAppR] = useState(null);
  const [rNote, setRNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const EMPTY_APP = {
    name: "", spec: "", dept: "", email: "", phone: "", license: "", experience: "", hospital: ""
  };

  const [f, setF] = useState(EMPTY_APP);

  // Fetch pending applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/applications/pending");
      const data = await res.json();

      if (res.ok) {
        const formattedApps = (data.applications || []).map(app => ({
          ...app,
          id: app._id || app.id,                    // Ensure id exists
          spec: app.specialization || app.spec,     // Normalize field names
          dept: app.department || app.dept
        }));
        setApps(formattedApps);
      } else {
        console.error("API Error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sub === "approve") {
      fetchApplications();
    }
  }, [sub]);

  // Approve Doctor
  const handleApprove = async (app) => {
    if (!app) {
      alert("No application selected");
      return;
    }

    const appId = app.id || app._id;   // Support both id and _id
    console.log("Approving app:", app);
    console.log("Using ID:", appId);
    if (!appId) {
      alert("Application ID is missing. Please refresh the page.");
      console.error("App object:", app);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/auth/applications/${appId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "Admin Singh" })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${app.name} has been approved successfully!`);

        // Add to active doctors
        const newDoctor = {
          id: `D-${Date.now().toString().slice(-4)}`,
          name: app.name,
          spec: app.specialization || app.spec || "General Medicine",
          dept: app.department || app.dept || "General",
          email: app.email,
          phone: app.phone || "",
          license: app.medicalId || app.license || "",
          patients: 0,
          status: "Active"
        };

        setRows(prev => [...prev, newDoctor]);
        setApps(prev => prev.filter(a => (a.id || a._id) !== appId));
        setAppA(null);
      } else {
        alert(data.message || "Failed to approve doctor");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Server error while approving. Check console for details.");
    }
  };

  // Reject Doctor
  const handleReject = async (app) => {
    if (!app || !app.id) return;

    try {
      const res = await fetch(`http://localhost:5000/api/auth/applications/${app.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rNote || "Not approved by admin",
          rejectedBy: "Admin Singh"
        })
      });

      if (res.ok) {
        alert(`Application from ${app.name} has been rejected`);
        setApps(prev => prev.filter(a => a.id !== app.id));
        setAppR(null);
        setRNote("");
      } else {
        alert("Failed to reject application");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while rejecting");
    }
  };

  const pendingCount = apps.filter(a => a.status === "Pending").length;

  return (
    <div>
      <PageHeader
        title="Doctor Management"
        sub={`${rows.length} active doctors · ${pendingCount} pending applications`}
      />

      <TabBar
        active={sub}
        onChange={setSub}
        tabs={[
          { id: "active", icon: "🩺", label: "Active Doctors" },
          { id: "register", icon: "➕", label: "New Doctor Application" },
          { id: "approve", icon: "📋", label: "Approve Applications", badge: pendingCount },
        ]}
      />

      {/* Active Doctors */}
      {sub === "active" && (
        <TCard>
          <table className="w-full">
            <TH cols={["Doctor ID", "Name & Email", "Specialization", "Dept", "Patients", "Status", "Actions"]} />
            <tbody>
              {rows.map((d, i) => (
                <TR key={d.id} i={i}>   {/* ← Fixed: added key */}
                  <TD mono>{d.id}</TD>
                  <TD>
                    <div className="font-semibold text-slate-800">{d.name}</div>
                    <div className="text-[11px] text-slate-400">{d.email}</div>
                  </TD>
                  <TD>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 bg-blue-50 text-blue-700 ring-blue-100">
                      {d.spec}
                    </span>
                  </TD>
                  <TD>{d.dept}</TD>
                  <TD>
                    <span className="font-semibold text-slate-800">{d.patients}</span>
                    <span className="text-slate-400 text-xs ml-1">pts</span>
                  </TD>
                  <TD><Pill v={d.status} /></TD>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <IBtn title="View" onClick={() => setView(d)}>👁</IBtn>
                      <IBtn title="Suspend" danger>🚫</IBtn>
                    </div>
                  </td>
                </TR>
              ))}
            </tbody>
          </table>
        </TCard>
      )}

      {/* Register New Doctor Form */}
      {sub === "register" && (
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6 max-w-2xl">
          {err && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">{err}</div>}

          <div className="space-y-4">
            <div><Lbl req>Full Name</Lbl>
              <Inp placeholder="Dr. Full Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Lbl req>Specialization</Lbl>
                <Sel value={f.spec} onChange={e => setF({ ...f, spec: e.target.value })}>
                  <option value="">Select Specialization</option>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </div>
              <div><Lbl req>Department</Lbl>
                <Sel value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                  <option value="">Select Department</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </Sel>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Lbl req>Email</Lbl>
                <Inp type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
              </div>
              <div><Lbl>Phone</Lbl>
                <Inp type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Lbl req>MCI License</Lbl>
                <Inp value={f.license} onChange={e => setF({ ...f, license: e.target.value })} placeholder="MCI-XXXX" />
              </div>
              <div><Lbl>Experience</Lbl>
                <Inp value={f.experience} onChange={e => setF({ ...f, experience: e.target.value })} />
              </div>
            </div>

            <div><Lbl>Hospital</Lbl>
              <Inp value={f.hospital} onChange={e => setF({ ...f, hospital: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => { setF(EMPTY_APP); setErr(""); }} className="px-6 py-3 border rounded-xl text-slate-500 hover:bg-slate-50">
              Clear
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={loading}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-70"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {/* Approve Tab */}
      {sub === "approve" && (
        <div className="space-y-4">
          {loading && <p className="text-center py-8 text-slate-500">Loading pending applications...</p>}

          {apps.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl ring-1 ring-slate-100">
              No pending doctor applications.
            </div>
          )}

          {apps.map((a) => (
            <div key={a.id || a._id} className="bg-white rounded-2xl p-6 ring-1 shadow-sm">   {/* ← Fixed key */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold flex items-center justify-center">
                  {a.name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{a.name}</div>
                  <div className="text-sm text-slate-600">{a.email}</div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div><span className="text-slate-400">Specialization:</span> {a.specialization || a.spec}</div>
                    <div><span className="text-slate-400">Department:</span> {a.department || a.dept}</div>
                    <div><span className="text-slate-400">License:</span> {a.medicalId || a.license}</div>
                  </div>
                </div>

                {a.status === "Pending" && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setAppA(a)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700">
                      Approve
                    </button>
                    <button onClick={() => setAppR(a)} className="bg-rose-50 text-rose-600 px-5 py-2 rounded-xl text-sm font-semibold ring-1 ring-rose-200 hover:bg-rose-100">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {appA && (
        <Modal title="Approve Doctor" onClose={() => setAppA(null)}>
          <p className="mb-6">Are you sure you want to approve <strong>{appA.name}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setAppA(null)} className="flex-1 py-3 border rounded-xl">Cancel</button>
            <button onClick={() => handleApprove(appA)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold">
              Confirm Approval
            </button>
          </div>
        </Modal>
      )}

      {appR && (
        <Modal title="Reject Application" onClose={() => { setAppR(null); setRNote(""); }}>
          <p className="mb-4">Reject application from <strong>{appR.name}</strong>?</p>
          <textarea
            value={rNote}
            onChange={(e) => setRNote(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-full h-24 border rounded-2xl p-4 text-sm mb-4"
          />
          <div className="flex gap-3">
            <button onClick={() => { setAppR(null); setRNote(""); }} className="flex-1 py-3 border rounded-xl">Cancel</button>
            <button onClick={() => handleReject(appR)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-semibold">
              Confirm Rejection
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const TabRecords = () => {
  const [typeF, setTypeF] = useState("All");
  const types = ["All", "X-Ray", "Prescription", "Blood Report", "MRI Scan"];
  const data = typeF === "All" ? INIT_RECORDS : INIT_RECORDS.filter(r => r.type === typeF);
  return (
    <div>
      <PageHeader title="Medical Records" sub={`${data.length} records`}
        action={<div className="flex gap-1.5 flex-wrap">{types.map(t => <button key={t} onClick={() => setTypeF(t)} className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${typeF === t ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-teal-300"}`}>{t}</button>)}</div>} />
      <TCard>
        <table className="w-full">
          <TH cols={["Record ID", "Patient", "Type", "Uploaded By", "Date", "Encrypted", "Actions"]} />
          <tbody>{data.map((r, i) => (
            <TR key={r.id} i={i}>
              <TD mono>{r.id}</TD>
              <TD><div className="font-semibold text-slate-800">{r.patient}</div></TD>
              <TD><span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${TYPE_PILL[r.type] || "bg-slate-50 text-slate-600 ring-slate-100"}`}>{r.type}</span></TD>
              <TD>{r.by}</TD>
              <TD><span className="text-xs text-slate-400">{r.date}</span></TD>
              <TD>{r.encrypted ? <Badge label="🔒 Encrypted" color="green" /> : <Badge label="⚠ Plaintext" color="red" />}</TD>
              <td className="px-4 py-3"><div className="flex items-center gap-1"><IBtn title="View">👁</IBtn><IBtn title="Archive">📦</IBtn><IBtn title="Flag" danger>🚩</IBtn></div></td>
            </TR>
          ))}</tbody>
        </table>
      </TCard>
    </div>
  );
};

const PagePeople = () => {
  const [tab, setTab] = useState("patients");
  return (
    <div>
      <div className="mb-6"><h1 className="text-xl font-bold text-slate-800">People & Records</h1><p className="text-xs text-slate-400 mt-0.5">Manage patients, doctors, and medical records</p></div>
      <TabBar active={tab} onChange={setTab} tabs={[{ id: "patients", icon: "👥", label: "Patients" }, { id: "doctors", icon: "🩺", label: "Doctors" }, { id: "records", icon: "📁", label: "Medical Records" }]} />
      {tab === "patients" && <TabPatients />}
      {tab === "doctors" && <TabDoctors />}
      {tab === "records" && <TabRecords />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE 3 — SECURITY & OPS
// ═══════════════════════════════════════════════════════════════

const TabAccess = () => {
  const [rows, setRows] = useState(
    INIT_ACCESS.map(r => ({
      ...r,
      accessStatus: r.status === "Approved" ? "granted" : r.status === "Denied" ? "rejected" : "granted",
      grantedBy: r.type === "Emergency" ? "emergency" : "policy"
    }))
  );

  const [filter, setFilter] = useState("All");
  const [detail, setDetail] = useState(null);
  const [temp, setTemp] = useState(null);
  const [dur, setDur] = useState("1 Hour");

  const FILTERS = ["All", "Doctor", "Nurse", "External", "Emergency", "Normal"];

  const data =
    filter === "All"
      ? rows
      : rows.filter(a => a.role === filter || a.type === filter);

  // 🚨 Emergency Access Grant (with blockchain log simulation)
  const grantEmergencyAccess = (req) => {
    console.log("🔗 Blockchain Log:", {
      action: "EMERGENCY_ACCESS_GRANTED",
      user: req.user,
      record: req.record,
      duration: dur,
      time: new Date().toISOString(),
    });

    setRows(r =>
      r.map(a =>
        a.id === req.id
          ? { ...a, accessStatus: "granted", grantedBy: "emergency" }
          : a
      )
    );

    setTemp(null);
  };

  return (
    <div>
      <PageHeader
        title="Access Monitor"
        sub="Access decisions enforced via encryption policies & patient consent"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${filter === f
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Access Cards */}
      <div className="space-y-3">
        {data.map(a => (
          <div
            key={a.id}
            className={`bg-white rounded-2xl p-5 ring-1 shadow-sm flex items-center gap-4 ${a.type === "Emergency"
                ? "ring-rose-200 bg-rose-50/20"
                : "ring-slate-100"
              }`}
          >
            <div
              className={`w-1 self-stretch rounded-full ${a.type === "Emergency" ? "bg-rose-400" : "bg-teal-400"
                }`}
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-slate-800 text-sm">
                  {a.user}
                </span>

                <Badge
                  label={a.role}
                  color={
                    a.role === "Doctor"
                      ? "blue"
                      : a.role === "Nurse"
                        ? "teal"
                        : "purple"
                  }
                />

                <Badge
                  label={a.type}
                  color={a.type === "Emergency" ? "red" : "gray"}
                />

                <Badge
                  label={
                    a.grantedBy === "policy"
                      ? "Policy Controlled"
                      : "Emergency Override"
                  }
                  color={a.grantedBy === "policy" ? "blue" : "red"}
                />
              </div>

              <p className="text-xs text-slate-500">
                Record:{" "}
                <span className="font-medium text-slate-700">
                  {a.record}
                </span>
              </p>

              <p className="text-xs text-slate-400 mt-0.5">
                {a.reason}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <Badge
                label={a.accessStatus === "granted" ? "Granted" : "Rejected"}
                color={a.accessStatus === "granted" ? "green" : "red"}
              />

              {a.type === "Emergency" && (
                <button
                  onClick={() => setTemp(a)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  🚨 Allow Emergency Access
                </button>
              )}

              {a.type !== "Emergency" && (
                <span className="text-[11px] text-slate-400">
                  Controlled via policy / consent
                </span>
              )}

              <button
                onClick={() => setDetail(a)}
                className="text-xs text-teal-600 font-semibold hover:underline"
              >
                Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {detail && (
        <Modal
          title={`Access Request — ${detail.id}`}
          onClose={() => setDetail(null)}
        >
          <div className="space-y-3 text-sm">
            {[
              ["User", detail.user],
              ["Role", detail.role],
              ["Type", detail.type],
              ["Record", detail.record],
              ["Reason", detail.reason],
              ["Granted By", detail.grantedBy],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-400">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setDetail(null)}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-100"
          >
            Close
          </button>
        </Modal>
      )}

      {/* Emergency Modal */}
      {temp && (
        <Modal
          title="🚨 Emergency Access Override"
          onClose={() => setTemp(null)}
        >
          <p className="text-sm text-slate-500 mb-4">
            Grant emergency access to{" "}
            <strong>{temp.user}</strong> for{" "}
            <strong>{temp.record}</strong>.
          </p>

          <div className="space-y-3">
            <div>
              <Lbl>Duration</Lbl>
              <Sel value={dur} onChange={e => setDur(e.target.value)}>
                {["1 Hour", "4 Hours", "12 Hours"].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </Sel>
            </div>

            <div>
              <Lbl>Justification</Lbl>
              <textarea
                rows={3}
                placeholder="Reason for emergency override..."
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setTemp(null)}
              className="flex-1 py-2.5 border rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => grantEmergencyAccess(temp)}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl"
            >
              Confirm Override
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const TabEmergency = () => {
  const [logs, setLogs] = useState(INIT_EMERGENCY);
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ patient: "", duration: "30 Minutes", reason: "" });
  const [err, setErr] = useState("");
  const handleOverride = () => {
    if (!f.patient || !f.reason.trim()) { setErr("Select a patient and provide justification."); return; }
    setLogs(l => [{ id: `E-0${l.length + 1}`, triggeredBy: "Admin Singh", patient: f.patient, duration: f.duration, time: new Date().toISOString().slice(0, 16).replace("T", " "), active: true }, ...l]);
    setModal(false); setF({ patient: "", duration: "30 Minutes", reason: "" }); setErr("");
  };
  return (
    <div>
      <PageHeader title="Emergency Access" sub="All actions are immutably logged and audited"
        action={<button onClick={() => setModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2">🚨 Trigger Override</button>} />
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-5">
        <span className="text-amber-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">Emergency access bypasses standard controls. All overrides are <strong>permanently logged</strong> and will trigger a compliance review within 24 hours.</p>
      </div>
      <div className="space-y-3">
        {logs.map(e => (
          <div key={e.id} className={`bg-white rounded-2xl p-5 ring-1 shadow-sm flex items-center gap-4 ${e.active ? "ring-rose-200 bg-rose-50/20" : "ring-slate-100"}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${e.active ? "bg-rose-500 animate-pulse" : "bg-slate-200"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-slate-800 text-sm">{e.triggeredBy}</span>{e.active && <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>}</div>
              <p className="text-xs text-slate-500">Patient: <span className="font-medium text-slate-700">{e.patient}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">Duration: {e.duration} &nbsp;·&nbsp; {e.time}</p>
            </div>
            {e.active ? <Badge label="ACTIVE" color="red" /> : <Badge label="Expired" color="gray" />}
          </div>
        ))}
      </div>
      {modal && <Modal title="⚠ Emergency Override" onClose={() => { setModal(false); setErr(""); }}>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4">This bypasses all standard restrictions and is <strong>permanently logged</strong> for compliance.</div>
        {err && <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">{err}</div>}
        <div className="space-y-3">
          <div><Lbl req>Patient Record</Lbl><Sel value={f.patient} onChange={e => setF({ ...f, patient: e.target.value })}><option value="">Select patient…</option>{INIT_PATIENTS.map(p => <option key={p.id}>{p.id} — {p.name}</option>)}</Sel></div>
          <div><Lbl>Duration</Lbl><Sel value={f.duration} onChange={e => setF({ ...f, duration: e.target.value })}>{["30 Minutes", "1 Hour", "2 Hours"].map(o => <option key={o}>{o}</option>)}</Sel></div>
          <div><Lbl req>Clinical Justification</Lbl><textarea rows={3} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} placeholder="Describe the emergency clearly…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 placeholder:text-slate-300" /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => { setModal(false); setErr(""); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleOverride} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm">Confirm Override</button>
        </div>
      </Modal>}
    </div>
  );
};

const TabAudit = () => {
  const [filter, setFilter] = useState("All");
  const data = filter === "All" ? INIT_LOGS : INIT_LOGS.filter(l => l.status === filter);
  return (
    <div>
      <PageHeader title="Audit Logs" sub="Immutable security and access log"
        action={<div className="flex items-center gap-2">
          {["All", "Success", "Denied"].map(f => <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all ${filter === f ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-teal-300"}`}>{f}</button>)}
          <button className="text-xs px-3.5 py-1.5 rounded-xl font-semibold bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-slate-300 transition-all">📥 Export</button>
        </div>} />
      <TCard>
        <table className="w-full">
          <TH cols={["#", "User / IP", "Action", "Record", "Timestamp", "Status"]} />
          <tbody>{data.map((l, i) => (
            <TR key={l.id} i={i}>
              <TD mono>{l.id}</TD>
              <TD><div className="font-medium text-slate-800">{l.user}</div></TD>
              <TD><div className="flex items-center gap-1.5 text-sm text-slate-600"><span>{ACTION_ICON[l.action] || "⚡"}</span>{l.action}</div></TD>
              <TD mono>{l.record}</TD>
              <TD><span className="text-xs text-slate-400">{l.time}</span></TD>
              <TD><Pill v={l.status} /></TD>
            </TR>
          ))}</tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-between">
          <span className="text-xs text-slate-400">{data.length} entries shown</span>
          <span className="text-xs text-slate-400">Retained 7 years per policy</span>
        </div>
      </TCard>
    </div>
  );
};

const TabSettings = () => {
  const [enc, setEnc] = useState(true);
  const [tls, setTls] = useState(true);
  const [purge, setPurge] = useState(true);
  const [ret, setRet] = useState("7 Years");
  const ROLES = [{ name: "Admin", desc: "Full system access", color: "blue" }, { name: "Doctor", desc: "Own patients & records only", color: "teal" }, { name: "Nurse", desc: "Assigned ward access", color: "purple" }, { name: "Patient", desc: "Own records only", color: "gray" }];
  const ADMINS = [{ name: "Admin Singh", role: "Super Admin", init: "AS", grad: "from-blue-400 to-indigo-500" }, { name: "Dr. Auth Kumar", role: "IT Admin", init: "AK", grad: "from-teal-400 to-cyan-500" }];
  const Card = ({ title, icon, children }) => <div className="bg-white rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm"><h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 pb-4 mb-4 border-b border-slate-50"><span>{icon}</span>{title}</h3><div className="space-y-4">{children}</div></div>;
  const Row = ({ label, sub, right }) => <div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium text-slate-700">{label}</p>{sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}</div><div className="flex-shrink-0">{right}</div></div>;
  return (
    <div>
      <div className="mb-5"><h2 className="text-lg font-bold text-slate-800">System Settings</h2><p className="text-xs text-slate-400 mt-0.5">Security, privacy and access configuration</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Encryption" icon="🔐">
          <Row label="AES-256 Record Encryption" sub="All medical records encrypted at rest" right={<Toggle on={enc} onToggle={() => setEnc(!enc)} />} />
          <Row label="TLS 1.3 in Transit" sub="Secure data transfer layer" right={<Toggle on={tls} onToggle={() => setTls(!tls)} />} />
          <div className="pt-3 border-t border-slate-50 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${enc ? "bg-emerald-400" : "bg-rose-400"}`} /><span className="text-xs text-slate-600 font-medium">{enc ? "All records protected (AES-256)" : "⚠ Records currently unprotected"}</span></div>
        </Card>
        <Card title="Data Retention" icon="🗄️">
          <Row label="Retention Period" sub="Minimum required by regulatory policy" right={<select value={ret} onChange={e => setRet(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">{["5 Years", "7 Years", "10 Years"].map(o => <option key={o}>{o}</option>)}</select>} />
          <Row label="Auto-purge on Expiry" sub="Permanently delete records past retention date" right={<Toggle on={purge} onToggle={() => setPurge(!purge)} />} />
          <div className="pt-3 border-t border-slate-50 flex gap-2"><Badge label={`${ret} retention`} color="blue" /><Badge label={purge ? "Auto-purge on" : "Manual purge"} color={purge ? "green" : "yellow"} /></div>
        </Card>
        <Card title="Role-Based Access (RBAC)" icon="👥">
          {ROLES.map(r => <div key={r.name} className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><Badge label={r.name} color={r.color} /><span className="text-[11px] text-slate-400">{r.desc}</span></div><button className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline transition-colors flex-shrink-0">Configure</button></div>)}
        </Card>
        <Card title="Admin Accounts" icon="🧑‍💼">
          {ADMINS.map(a => <div key={a.name} className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>{a.init}</div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-700">{a.name}</p><p className="text-[11px] text-slate-400">{a.role}</p></div><div className="flex gap-1"><IBtn title="Edit">✏️</IBtn><IBtn title="Suspend" danger>🚫</IBtn></div></div>)}
          <button className="w-full mt-1 py-2.5 rounded-xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-all">+ Add Admin Account</button>
        </Card>
      </div>
    </div>
  );
};

const PageSecurity = () => {
  const [tab, setTab] = useState("access");
  return (
    <div>
      <div className="mb-6"><h1 className="text-xl font-bold text-slate-800">Security & Operations</h1><p className="text-xs text-slate-400 mt-0.5">Access control, emergency overrides, audit logs, and system settings</p></div>
      <TabBar active={tab} onChange={setTab} tabs={[
        { id: "access", icon: "🔐", label: "Access Monitor" },
        { id: "emergency", icon: "🚨", label: "Emergency" },
        { id: "audit", icon: "📜", label: "Audit Logs" },
        { id: "settings", icon: "⚙️", label: "Settings" },
      ]} />
      {tab === "access" && <TabAccess />}
      {tab === "emergency" && <TabEmergency />}
      {tab === "audit" && <TabAudit />}
      {tab === "settings" && <TabSettings />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SHELL
// ═══════════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "people", icon: "👥", label: "People & Records", badge: 3 },
  { id: "security", icon: "🔐", label: "Security & Ops", badge: 14 },
];
const NOTIFS = [
  { type: "alert", msg: "Unauthorized login — IP 192.168.4.21", time: "09:31 AM" },
  { type: "warn", msg: "14 pending consent requests", time: "08:00 AM" },
  { type: "alert", msg: "Emergency override by Dr. F. Zaidi", time: "Yesterday" },
];

export default function HealthcareAdminDashboard() {
  const [page, setPage] = useState("dashboard");
  const [notif, setNotif] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col shadow-sm flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">H</div>
          <div><p className="text-sm font-bold text-slate-800 leading-none">SecureMed</p><p className="text-[10px] text-slate-400 mt-0.5">Management Portal</p></div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-3 mb-3">Navigation</p>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === n.id ? "bg-teal-50 text-teal-700 ring-1 ring-teal-100 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
              <span className={`text-base transition-transform ${page === n.id ? "scale-110" : ""}`}>{n.icon}</span>
              <span className="flex-1 text-left truncate">{n.label}</span>
              {n.badge && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{n.badge}</span>}
              {page === n.id && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold">AS</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-700 truncate">Admin Singh</p><p className="text-[10px] text-slate-400">Super Admin</p></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shadow-sm flex-shrink-0 z-10">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">🔍</span>
            <input placeholder="Search patients, doctors, records…" className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white placeholder:text-slate-300 transition-all" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <button onClick={() => setNotif(!notif)} className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-lg">🔔</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>
              {notif && <>
                <div className="fixed inset-0 z-10" onClick={() => setNotif(false)} />
                <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden" style={{ width: 300 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">{NOTIFS.length} new</span>
                  </div>
                  {NOTIFS.map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3">
                      <span className="flex-shrink-0 mt-0.5">{n.type === "alert" ? "🚨" : "⚠️"}</span>
                      <div><p className={`text-xs font-medium ${n.type === "alert" ? "text-rose-700" : "text-amber-700"}`}>{n.msg}</p><p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p></div>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 text-center"><button className="text-xs text-teal-600 font-semibold hover:underline">View all</button></div>
                </div>
              </>}
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">AS</div>
              <div><p className="text-xs font-semibold text-slate-700 leading-none">Admin Singh</p><p className="text-[10px] text-slate-400">Super Admin</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {page === "dashboard" && <PageDashboard setPage={setPage} />}
          {page === "people" && <PagePeople />}
          {page === "security" && <PageSecurity />}
        </main>
      </div>
    </div>
  );
}