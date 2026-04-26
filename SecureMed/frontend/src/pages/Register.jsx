import React, { useState } from 'react';
import { ShieldCheck, User, Stethoscope, ArrowLeft } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Doctor specific fields
    medicalId: '',
    specialization: '',
    department: '',
    hospital: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const payload = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role
    };

    // Add doctor-specific fields only if registering as doctor
    if (role === 'doctor') {
      payload.medicalId = formData.medicalId;
      payload.specialization = formData.specialization;
      payload.department = formData.department;
      payload.phone = formData.phone || "";
      payload.experience = formData.experience || "";
      payload.hospital = formData.hospital || "City General Hospital";
    }

    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please check console.");
  }

  setLoading(false);
};

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', password: '', confirmPassword: '', phone: '',
      medicalId: '', specialization: '', department: '', hospital: ''
    });
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">
            {role === 'patient' ? 'Account Created Successfully!' : 'Registration Request Submitted'}
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {role === 'patient' 
              ? 'Your patient account has been created. You can now login to your dashboard.' 
              : 'Thank you! Your doctor registration request has been sent to the Admin for verification. Once approved, you will receive your login credentials via email.'}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl transition-all"
            >
              Go to Login
            </button>
            <button
              onClick={resetForm}
              className="w-full border border-teal-200 text-teal-600 font-medium py-3 rounded-2xl hover:bg-gray-50"
            >
              Register Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white tracking-tight">SecureMed</h1>
          </div>
          <p className="text-teal-100 text-lg">Patient-Controlled Medical Records</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-3xl font-semibold text-gray-900">Create New Account</h2>
            </div>

            {/* Role Selector */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button
                onClick={() => setRole('patient')}
                className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2
                  ${role === 'patient' ? 'bg-white shadow-md text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <User className="w-4 h-4" /> Patient
              </button>
              <button
                onClick={() => setRole('doctor')}
                className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2
                  ${role === 'doctor' ? 'bg-white shadow-md text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Stethoscope className="w-4 h-4" /> Doctor
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                  placeholder={role === 'doctor' ? "Dr. Amit Sharma" : "Priya Verma"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Doctor Specific Fields */}
              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medical Registration ID (MCI / State Council)</label>
                    <input
                      type="text"
                      name="medicalId"
                      value={formData.medicalId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                      placeholder="MCI-45678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                      placeholder="Cardiology, Neurology, Pediatrics, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                      placeholder="Emergency Medicine, General Surgery, ICU, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital / Clinic Name</label>
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                      placeholder="AIIMS Delhi, Fortis Hospital, etc."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500"
                  placeholder="Re-enter password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all flex items-center justify-center"
              >
                {loading 
                  ? "Processing..." 
                  : role === 'patient' 
                    ? "Create Patient Account" 
                    : "Submit Doctor Registration Request"}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-100 px-8 py-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-teal-600 font-semibold hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;