/**
 * Register.jsx
 *
 * KEY SECURITY ARCHITECTURE:
 *
 *   Old (broken):
 *     Backend generates keypair → returns sk → frontend saves to localStorage
 *     Problem: sk travels over network, sits in localStorage forever
 *
 *   New (correct):
 *     1. Browser generates Kyber768 keypair via WASM (browserKeygen)
 *     2. sk is shown ONCE on screen — patient must copy it
 *     3. Patient checks a checkbox confirming they saved it
 *     4. Only pk is sent to backend — sk never touches the network
 *     5. After registration, sk is wiped from component state on unmount
 */

import React, { useState, useRef, useEffect } from "react";
import { ShieldCheck, User, Stethoscope, ArrowLeft, Copy, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { registerUser } from "../services/api";
import { browserKeygen } from "../services/preService.browser";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", medicalId: "", specialization: "", department: "",
  hospital: "", experience: "",
};

const inputCls = "w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-2";

// ─── KeyRevealScreen ──────────────────────────────────────────────────────────
/**
 * Shown after successful registration — displays sk ONCE.
 * Patient must copy it and confirm before they can proceed to login.
 * sk is wiped from state when this component unmounts.
 */
function KeyRevealScreen({ skB64, role, onDone }) {
  const [copied,    setCopied]    = useState(false);
  const [showKey,   setShowKey]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const skRef = useRef(skB64); // keep a ref so we can wipe on unmount

  useEffect(() => {
    return () => {
      // Wipe the ref on unmount — belt and suspenders
      if (skRef.current) skRef.current = "";
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(skRef.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard without interaction
      const ta = document.createElement("textarea");
      ta.value = skRef.current;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDone = () => {
    // Wipe before handing control back
    skRef.current = "";
    onDone();
  };

  // Mask key for display — show only if patient clicks Show
  const displayKey = showKey
    ? skRef.current
    : skRef.current.slice(0, 6) + "•".repeat(40) + skRef.current.slice(-6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-cyan-800 to-sky-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-full">

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-9 h-9 text-amber-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Save Your Secret Key — Now
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
          This key is shown <strong>only once</strong> and is <strong>never stored</strong> on our servers.
          Without it, you cannot approve access to your medical records.
          Store it in a password manager or secure notes app.
        </p>

        {/* Key display box */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Your Kyber768 Secret Key (skPre)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="text-gray-400 hover:text-white transition-colors"
                title={showKey ? "Hide key" : "Reveal key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <p
            className="text-green-400 font-mono text-xs break-all leading-relaxed select-all"
            style={{ userSelect: "all" }}
          >
            {displayKey}
          </p>
        </div>

        {/* Warning banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <ul className="text-xs text-red-700 space-y-1 list-disc list-inside leading-relaxed">
            <li>This key will <strong>never be shown again</strong>.</li>
            <li>We do not store it. It cannot be recovered if lost.</li>
            <li>Do <strong>not</strong> save it in your browser or in a plain text file.</li>
            <li>Use a password manager (1Password, Bitwarden, KeePass, etc.)</li>
          </ul>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6 select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I have copied and securely saved my secret key. I understand I cannot
            approve access requests without it, and it cannot be recovered if lost.
          </span>
        </label>

        {/* CTA */}
        <button
          type="button"
          onClick={handleDone}
          disabled={!confirmed}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all text-base"
        >
          I've saved my key — Go to Login
        </button>

        {role === "doctor" && (
          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            Your doctor application is pending admin review. You will be notified once approved.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Register component ──────────────────────────────────────────────────

const Register = () => {
  const [role,     setRole]     = useState("patient");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  // skB64 is held in state only until KeyRevealScreen wipes it
  const [skB64,    setSkB64]    = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!formData.fullName.trim())    return "Full name is required.";
    if (!formData.email.trim())       return "Email is required.";
    if (!formData.phone.trim())       return "Phone number is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    if (role === "doctor") {
      if (!formData.medicalId.trim())      return "Medical Registration ID is required.";
      if (!formData.specialization.trim()) return "Specialization is required.";
      if (!formData.department.trim())     return "Department is required.";
      if (!formData.hospital.trim())       return "Hospital / Clinic name is required.";
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      // ── Step 1: Generate keypair in the browser ───────────────────────────
      // sk never leaves this function until shown on KeyRevealScreen
      const { pkB64, skB64: generatedSk } = await browserKeygen();

      // ── Step 2: Register — send ONLY pk, not sk ───────────────────────────
      const payload = {
        name:     formData.fullName.trim(),
        email:    formData.email.trim(),
        password: formData.password,
        phone:    formData.phone.trim(),
        role,
        pkPre:    pkB64,           // ← public key only
        // skPre intentionally NOT included
      };
      if (role === "doctor") {
        payload.medicalId      = formData.medicalId.trim();
        payload.specialization = formData.specialization;
        payload.department     = formData.department;
        payload.hospital       = formData.hospital.trim();
        payload.experience     = formData.experience.trim();
      }

      await registerUser(payload);

      // ── Step 3: Hand sk to the reveal screen — it will wipe it on done ────
      setSkB64(generatedSk);

    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSkB64(null);
    setError("");
  };

  // ── If registration succeeded, show the key reveal screen ─────────────────
  if (skB64) {
    return (
      <KeyRevealScreen
        skB64={skB64}
        role={role}
        onDone={() => {
          setSkB64(null); // wipe from parent state too
          window.location.href = "/login";
        }}
      />
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
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
              <a href="/login" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={24} />
              </a>
              <h2 className="text-2xl font-semibold text-gray-900">Create New Account</h2>
            </div>

            {/* Role tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              {[
                { id: "patient", label: "Patient",  Icon: User         },
                { id: "doctor",  label: "Doctor",   Icon: Stethoscope  },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setRole(id); setError(""); }}
                  className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                    role === id ? "bg-white shadow-md text-teal-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Key generation info banner */}
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
              <p className="text-xs font-semibold text-teal-800 mb-1">🔐 End-to-end encryption</p>
              <p className="text-xs text-teal-700 leading-relaxed">
                A Kyber768 keypair will be generated in your browser when you register.
                Your private key is <strong>never sent to our servers</strong> — you will be
                shown it once to save securely.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName}
                  onChange={handleChange} required className={inputCls}
                  placeholder={role === "doctor" ? "Dr. Amit Sharma" : "Priya Verma"} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} required className={inputCls}
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} required className={inputCls}
                  placeholder="+91 98765 43210" />
              </div>

              {role === "doctor" && (
                <>
                  <div>
                    <label className={labelCls}>Medical Registration ID</label>
                    <input type="text" name="medicalId" value={formData.medicalId}
                      onChange={handleChange} required className={inputCls}
                      placeholder="MCI-45678" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Specialization</label>
                      <select name="specialization" value={formData.specialization}
                        onChange={handleChange} required className={inputCls}>
                        <option value="">Select…</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <select name="department" value={formData.department}
                        onChange={handleChange} required className={inputCls}>
                        <option value="">Select…</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Hospital / Clinic Name</label>
                    <input type="text" name="hospital" value={formData.hospital}
                      onChange={handleChange} required className={inputCls}
                      placeholder="AIIMS Delhi, Fortis Hospital, etc." />
                  </div>
                  <div>
                    <label className={labelCls}>Years of Experience</label>
                    <input type="text" name="experience" value={formData.experience}
                      onChange={handleChange} className={inputCls}
                      placeholder="e.g. 8 years" />
                  </div>
                </>
              )}

              <div>
                <label className={labelCls}>Password</label>
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} required className={inputCls}
                  placeholder="At least 6 characters" />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input
                  type="password" name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange} required
                  className={`${inputCls} ${
                    formData.confirmPassword && formData.confirmPassword !== formData.password
                      ? "border-red-400 focus:ring-red-400" : ""
                  }`}
                  placeholder="Re-enter password"
                />
                {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-base transition-all"
              >
                {loading
                  ? "Generating keys & registering…"
                  : role === "patient"
                  ? "Create Patient Account"
                  : "Submit Doctor Registration"}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-100 px-8 py-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
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