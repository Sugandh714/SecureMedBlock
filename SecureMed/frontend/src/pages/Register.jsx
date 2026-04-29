import React, { useState } from 'react';
import { ShieldCheck, User, Stethoscope, ArrowLeft } from 'lucide-react';
import { registerUser } from "../services/api";

const SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopaedics", "Oncology",
  "Dermatology", "Gynaecology", "Psychiatry", "General Medicine",
  "Paediatrics", "Radiology", "Emergency Medicine",
];
const DEPARTMENTS = [
  "Cardiology", "Neurology", "Surgery", "Oncology",
  "Skin & Hair", "Women Health", "Mental Health", "General",
  "Paediatrics", "Radiology", "Emergency",
];
const EMPTY_FORM = {
  fullName: '', email: '', password: '', confirmPassword: '',
  phone: '', medicalId: '', specialization: '', department: '',
  hospital: '', experience: '',
};

const Register = () => {
  const [role,     setRole]     = useState('patient');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.fullName.trim())  return "Full name is required.";
    if (!formData.email.trim())     return "Email is required.";
    if (!formData.phone.trim())     return "Phone number is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    if (role === 'doctor') {
      if (!formData.medicalId.trim())      return "Medical Registration ID is required.";
      if (!formData.specialization.trim()) return "Specialization is required.";
      if (!formData.department.trim())     return "Department is required.";
      if (!formData.hospital.trim())       return "Hospital / Clinic name is required.";
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const payload = {
        name: formData.fullName.trim(), email: formData.email.trim(),
        password: formData.password, phone: formData.phone.trim(), role,
      };
      if (role === 'doctor') {
        payload.medicalId      = formData.medicalId.trim();
        payload.specialization = formData.specialization;
        payload.department     = formData.department;
        payload.hospital       = formData.hospital.trim();
        payload.experience     = formData.experience.trim();
      }

      const data = await registerUser(payload);

      // ── Save private key ──────────────────────────────────────────────
      // Backend generates PRE keypair and returns skPre ONCE.
      // Public key is already stored server-side (pkPre on User document).
      // We key it by email so Login can look it up after sign-in.
      if (data.skPre) {
        const storageKey = `skPre_${formData.email.trim().toLowerCase()}`;
        localStorage.setItem(storageKey, data.skPre);
        console.log("🔑 PRE private key saved to localStorage.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setFormData(EMPTY_FORM); setSuccess(false); setError(''); };

  const inputCls = "w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm";
  const labelCls = "block text-sm font-medium text-gray-700 mb-2";

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">
            {role === 'patient' ? 'Account Created!' : 'Application Submitted'}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {role === 'patient'
              ? 'Your account is ready and your encryption keys have been set up automatically.'
              : 'Your doctor registration is pending admin review. You will receive credentials via email once approved.'}
          </p>
          {role === 'patient' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
              <p className="text-xs font-semibold text-amber-800 mb-1">🔑 Encryption Key Saved</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your private encryption key has been saved to this browser. Do not clear browser
                data without exporting your key, or you will lose access to your encrypted records.
              </p>
            </div>
          )}
          <div className="space-y-3">
            <a href="/login" className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl transition-all text-center">
              Go to Login
            </a>
            <button onClick={resetForm} className="w-full border border-teal-200 text-teal-600 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-all">
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
              <a href="/login" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft size={24} /></a>
              <h2 className="text-2xl font-semibold text-gray-900">Create New Account</h2>
            </div>

            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              {[{ id: 'patient', label: 'Patient', Icon: User }, { id: 'doctor', label: 'Doctor', Icon: Stethoscope }].map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => { setRole(id); setError(''); }}
                  className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${role === id ? 'bg-white shadow-md text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                  className={inputCls} placeholder={role === 'doctor' ? "Dr. Amit Sharma" : "Priya Verma"} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} placeholder="+91 98765 43210" />
              </div>

              {role === 'doctor' && (
                <>
                  <div>
                    <label className={labelCls}>Medical Registration ID</label>
                    <input type="text" name="medicalId" value={formData.medicalId} onChange={handleChange} required className={inputCls} placeholder="MCI-45678" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Specialization</label>
                      <select name="specialization" value={formData.specialization} onChange={handleChange} required className={inputCls}>
                        <option value="">Select…</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <select name="department" value={formData.department} onChange={handleChange} required className={inputCls}>
                        <option value="">Select…</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Hospital / Clinic Name</label>
                    <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} required className={inputCls} placeholder="AIIMS Delhi, Fortis Hospital, etc." />
                  </div>
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="text" name="experience" value={formData.experience} onChange={handleChange} className={inputCls} placeholder="e.g. 8 years" />
                  </div>
                </>
              )}

              <div>
                <label className={labelCls}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputCls} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                  className={`${inputCls} ${formData.confirmPassword && formData.confirmPassword !== formData.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Re-enter password" />
                {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full mt-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-all">
                {loading ? "Processing…" : role === 'patient' ? "Create Patient Account" : "Submit Doctor Registration"}
              </button>
            </form>
          </div>
          <div className="border-t border-gray-100 px-8 py-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-teal-600 font-semibold hover:underline">Sign in here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;