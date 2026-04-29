import React, { useState, useEffect } from 'react';
import { Users, Bell, AlertTriangle, FileText, Upload, Shield, History, User, LogOut } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../services/api";
import { logout } from "../../services/auth";

const DoctorDashboard = () => {
  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctor,          setDoctor]          = useState({ name: "", specialty: "", hospital: "" });

  const navigate = useNavigate();

  // Load real profile on mount
  useEffect(() => {
    getProfile()
      .then(res => {
        const d = res?.data || {};
        setDoctor({
          name:      d.name         || "Doctor",
          specialty: d.specialization || d.specialty || "",
          hospital:  d.hospital     || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => logout(navigate);

  const stats = { totalPatients: 47, pendingRequests: 8, emergencyAlerts: 3, recentActivity: 12 };

  const patients = [
    { id: 1, name: "Aarav Sharma",  age: 45, gender: "Male",   condition: "Hypertension",       status: "Stable"     },
    { id: 2, name: "Priya Patel",   age: 32, gender: "Female", condition: "Diabetes Type 2",    status: "Critical"   },
    { id: 3, name: "Rohan Mehra",   age: 67, gender: "Male",   condition: "Post Cardiac Surgery",status: "Recovering" },
    { id: 4, name: "Ananya Gupta",  age: 28, gender: "Female", condition: "Migraine",            status: "Stable"     },
  ];

  const doctorInitial = doctor.name?.split(" ").find(p => p)?.slice(-1)[0]?.toUpperCase() || "D";

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard',        icon: Users          },
    { id: 'patients',  label: 'My Patients',      icon: Users          },
    { id: 'records',   label: 'Medical Records',  icon: FileText       },
    { id: 'requests',  label: 'Access Requests',  icon: Shield         },
    { id: 'upload',    label: 'Upload Records',   icon: Upload         },
    { id: 'emergency', label: 'Emergency Access', icon: AlertTriangle  },
    { id: 'logs',      label: 'Activity Logs',    icon: History        },
    { id: 'profile',   label: 'My Profile',       icon: User           },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
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
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile + Logout */}
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
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h2>
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

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Patients",    value: stats.totalPatients,    bg: "bg-white"     },
                { label: "Pending Requests",  value: stats.pendingRequests,  bg: "bg-white"     },
                { label: "Emergency Alerts",  value: stats.emergencyAlerts,  bg: "bg-red-50"    },
                { label: "Recent Activity",   value: stats.recentActivity,   bg: "bg-white"     },
              ].map(({ label, value, bg }) => (
                <div key={label} className={`${bg} p-6 rounded-2xl shadow-sm ring-1 ring-slate-100`}>
                  <p className="text-sm text-gray-500">{label}</p>
                  <h2 className="text-3xl font-bold mt-1">{value}</h2>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["Name", "Age", "Gender", "Condition", "Status", "Action"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id} className={`border-b last:border-b-0 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-5 py-4 font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{p.age}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{p.gender}</td>
                      <td className="px-5 py-4 text-gray-600 text-sm">{p.condition}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          p.status === "Stable"     ? "bg-green-100 text-green-700" :
                          p.status === "Critical"   ? "bg-red-100 text-red-700"     :
                          "bg-amber-100 text-amber-700"
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedPatient(p)}
                          className="text-xs font-semibold text-blue-600 hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'profile' && (
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
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}

          {['records','requests','upload','emergency','logs'].includes(activeTab) && (
            <div className="bg-white p-10 text-center rounded-2xl ring-1 ring-slate-100 shadow-sm">
              <p className="text-2xl mb-2">🚀</p>
              <p className="text-gray-500 font-medium">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-1">{selectedPatient.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedPatient.condition}</p>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p><span className="font-medium">Age:</span> {selectedPatient.age}</p>
              <p><span className="font-medium">Gender:</span> {selectedPatient.gender}</p>
              <p><span className="font-medium">Status:</span> {selectedPatient.status}</p>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;