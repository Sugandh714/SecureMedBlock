import React, { useState } from 'react';
import { 
  Users, Bell, Clock, AlertTriangle, 
  FileText, Upload, Shield, History, User, LogOut 
} from 'lucide-react';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctor, setDoctor] = useState({
    name: "Dr. Dev Sharma",
    specialty: "Cardiologist",
    hospital: "Max Hospital"
  });

  const stats = {
    totalPatients: 47,
    pendingRequests: 8,
    emergencyAlerts: 3,
    recentActivity: 12
  };

  const patients = [
    { id: 1, name: "Aarav Sharma", age: 45, gender: "Male", condition: "Hypertension", status: "Stable" },
    { id: 2, name: "Priya Patel", age: 32, gender: "Female", condition: "Diabetes Type 2", status: "Critical" },
    { id: 3, name: "Rohan Mehra", age: 67, gender: "Male", condition: "Post Cardiac Surgery", status: "Recovering" },
    { id: 4, name: "Ananya Gupta", age: 28, gender: "Female", condition: "Migraine", status: "Stable" },
  ];

  const recentActivity = [
    { time: "10 min ago", action: "Viewed MRI report of Priya Patel" },
    { time: "2 hours ago", action: "Requested access to Aarav Sharma's blood reports" },
    { time: "Yesterday", action: "Uploaded prescription for Rohan Mehra" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <div className="w-72 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              🩺
            </div>
            <div>
              <h1 className="text-xl font-bold">SecureMed</h1>
              <p className="text-sm text-gray-500">Doctor Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Users },
              { id: 'patients', label: 'My Patients', icon: Users },
              { id: 'records', label: 'Medical Records', icon: FileText },
              { id: 'requests', label: 'Access Requests', icon: Shield },
              { id: 'upload', label: 'Upload Records', icon: Upload },
              { id: 'emergency', label: 'Emergency Access', icon: AlertTriangle },
              { id: 'logs', label: 'Activity Logs', icon: History },
              { id: 'profile', label: 'My Profile', icon: User },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
              {doctor.name.split(" ")[1][0]}
            </div>
            <div className="flex-1">
              <p className="font-medium">{doctor.name}</p>
              <p className="text-xs text-gray-500">
                {doctor.specialty} • {doctor.hospital}
              </p>
            </div>
            <LogOut className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1">
        
        {/* Navbar */}
        <div className="bg-white border-b px-8 py-4 flex justify-between">
          <h2 className="text-xl font-semibold capitalize">
            {activeTab}
          </h2>

          <div className="flex items-center gap-6">
            <Bell className="w-6 h-6" />

            <div className="text-right">
              <p className="font-medium">{doctor.name}</p>
              <p className="text-xs text-gray-500">Welcome back 👋</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl">
                <p>Total Patients</p>
                <h2 className="text-3xl">{stats.totalPatients}</h2>
              </div>

              <div className="bg-white p-6 rounded-xl">
                <p>Pending Requests</p>
                <h2 className="text-3xl">{stats.pendingRequests}</h2>
              </div>

              <div className="bg-red-100 p-6 rounded-xl">
                <p>Emergency</p>
                <h2 className="text-3xl">{stats.emergencyAlerts}</h2>
              </div>

              <div className="bg-white p-6 rounded-xl">
                <p>Activity</p>
                <h2 className="text-3xl">{stats.recentActivity}</h2>
              </div>
            </div>
          )}

          {/* Patients */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-xl p-6">
              {patients.map(p => (
                <div key={p.id} className="flex justify-between p-4 border-b">
                  <p>{p.name}</p>
                  <button onClick={() => setSelectedPatient(p)}>View</button>
                </div>
              ))}
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl p-8 max-w-3xl">
              <h2 className="text-2xl mb-6">My Profile</h2>

              <div className="flex gap-6 mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                  {doctor.name.split(" ")[1][0]}
                </div>
                <div>
                  <p className="text-xl">{doctor.name}</p>
                  <p>{doctor.specialty}</p>
                  <p className="text-gray-500">{doctor.hospital}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded">
                  Email: dev.sharma@hospital.com
                </div>
                <div className="bg-gray-100 p-4 rounded">
                  Phone: +91 9876543210
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {['records','requests','upload','emergency','logs'].includes(activeTab) && (
            <div className="bg-white p-10 text-center rounded-xl">
              Section Coming Soon 🚀
            </div>
          )}

        </div>
      </div>

      {/* Patient Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl w-96">
            <h2 className="text-xl">{selectedPatient.name}</h2>
            <p>{selectedPatient.condition}</p>

            <button 
              onClick={() => setSelectedPatient(null)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;