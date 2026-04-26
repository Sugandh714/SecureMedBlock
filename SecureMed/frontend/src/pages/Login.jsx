import React, { useState } from 'react';
import { ShieldCheck, User, Stethoscope, UserCog, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [role, setRole] = useState('patient');
  const [loginIdentifier, setLoginIdentifier] = useState('');  // Email OR Username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

 

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  loginIdentifier: loginIdentifier.trim(), // ✅ trim whitespace
  password: password,
  role: role,
}),
    });

    const data = await res.json();
    

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful!");

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    setError("Server error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">SecureMed</h1>
          </div>
          <p className="text-teal-100">Patient-Controlled Medical Records</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-3xl font-semibold text-center mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-center mb-8">Sign in to access your dashboard</p>

            {/* Role Selector */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  role === 'patient' ? 'bg-white shadow text-teal-700' : 'text-gray-600'
                }`}
              >
                <User size={16} /> Patient
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  role === 'doctor' ? 'bg-white shadow text-teal-700' : 'text-gray-600'
                }`}
              >
                <Stethoscope size={16} /> Doctor
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  role === 'admin' ? 'bg-white shadow text-teal-700' : 'text-gray-600'
                }`}
              >
                <UserCog size={16} /> Admin
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">

              <div>
                <input
  type="text"
  placeholder="Email or Full Name"
  value={loginIdentifier}
  onChange={(e) => setLoginIdentifier(e.target.value)}
  required
  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
/>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>
          </div>

          {/* Footer */}
          <div className="border-t px-8 py-6 text-center">
            <p className="text-gray-600">
              Don’t have an account?{" "}
              <a href="/register" className="text-teal-600 font-semibold hover:underline">
                Create Account
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;