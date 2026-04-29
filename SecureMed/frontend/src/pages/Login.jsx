import React, { useState } from 'react';
import { ShieldCheck, User, Stethoscope, UserCog, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const [role,            setRole]            = useState('patient');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password,        setPassword]        = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser({
        loginIdentifier: loginIdentifier.trim(),
        password,
        role,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));

      // ── Handle skPre returned on first login (existing accounts without keys) ──
      // The backend generates keys and returns skPre once if the user had none.
      // We store it keyed by email — identical to what Register.jsx does.
      if (data.skPre && data.user?.email) {
        const storageKey = `skPre_${data.user.email.toLowerCase()}`;
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, data.skPre);
          console.log("🔑 PRE private key saved from login response.");
        }
      }

      // Route by role returned from server (source of truth)
      const serverRole = data.user?.role;
      if (serverRole === "admin")       navigate("/admin");
      else if (serverRole === "doctor") navigate("/doctor");
      else                              navigate("/dashboard");

    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { id: 'patient', label: 'Patient', Icon: User        },
    { id: 'doctor',  label: 'Doctor',  Icon: Stethoscope },
    { id: 'admin',   label: 'Admin',   Icon: UserCog     },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">SecureMed</h1>
          </div>
          <p className="text-teal-100">Patient-Controlled Medical Records</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-3xl font-semibold text-center mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-center mb-8">Sign in to access your dashboard</p>

            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              {ROLES.map(({ id, label, Icon }) => (
                <button key={id} type="button"
                  onClick={() => { setRole(id); setError(''); }}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium ${
                    role === id ? 'bg-white shadow text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email or Full Name</label>
                <input type="text" placeholder="you@example.com or Your Name"
                  value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Your password"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <div className="border-t px-8 py-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a href="/register" className="text-teal-600 font-semibold hover:underline">Create Account</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;