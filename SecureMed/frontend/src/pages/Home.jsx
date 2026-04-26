import React from 'react';
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* Tailwind CSS via CDN for standalone preview - remove in production and use your own setup */}
      <style>
        {`
          @import url('https://cdn.tailwindcss.com');
          @tailwind base;
          @tailwind components;
          @tailwind utilities;
          
          .tailwind-ready * {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
        `}
      </style>
      
      <div className="tailwind-ready min-h-screen bg-slate-50">
        {/* NAVBAR */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-8 py-5 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-x-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner">
                🛡️
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-slate-900">SecureMed</span>
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-emerald-100 text-emerald-700 rounded-3xl">Beta</span>
            </div>

            {/* Menu Links */}
            <div className="hidden md:flex items-center gap-x-8 text-slate-600 font-medium">
              <a href="#" className="hover:text-emerald-600 transition-colors">Home</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">How it Works</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Technology</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">For Patients</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">For Doctors</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">About</a>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-x-4">
              {/* Small Login Button as requested */}
              <button 
      onClick={() => navigate("/login")}
      className="text-sm font-semibold px-6 py-2.5 border border-slate-300 hover:border-slate-400 rounded-3xl flex items-center gap-x-2 transition-all active:scale-95"
    >
      <span className="text-emerald-600">🔑</span>
      <span>Login</span>
    </button>

              {/* Secondary CTA */}
              <button 
                onClick={() => alert('Sign-up flow would start here')}
                className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2.5 rounded-3xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                Get Started Free
              </button>

              {/* Mobile menu button */}
              <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-700 border border-slate-200 rounded-2xl">
                ☰
              </button>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header className="bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 text-white">
          <div className="max-w-screen-2xl mx-auto px-8 pt-20 pb-16 grid md:grid-cols-12 gap-16 items-center">
            
            {/* Left content */}
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-x-2 bg-white/20 backdrop-blur-md text-white text-sm font-medium px-5 py-2 rounded-3xl mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
                Now live on IPFS + Blockchain
              </div>

              <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter">
                Your health.<br />
                Your rules.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">Always secure.</span>
              </h1>

              <p className="mt-8 text-2xl text-white/90 max-w-lg">
                A secure, patient-controlled medical record sharing system.
              </p>

              <p className="mt-6 text-lg text-white/80 max-w-xl">
                Patients own their data. Doctors request access only when eligible. 
                Every action is transparent and immutable.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button 
                  className="px-8 py-5 bg-white text-emerald-700 font-semibold text-lg rounded-3xl flex items-center gap-x-3 hover:shadow-2xl transition-all"
                  onClick={() => window.scrollTo({ top: document.getElementById('technology').offsetTop - 80, behavior: 'smooth' })}
                >
                  Explore the Technology
                  <span className="text-2xl">→</span>
                </button>
                
                <button 
                  className="px-8 py-5 border-2 border-white/70 hover:border-white text-white font-semibold text-lg rounded-3xl transition-all"
                  onClick={() => alert('Video demo would play in a modal')}
                >
                  Watch 60-second demo
                </button>
              </div>

              {/* Trust bar */}
              <div className="mt-14 flex items-center gap-x-8 text-sm">
                <div className="flex items-center gap-x-2">
                  <span className="text-emerald-300">🔒</span>
                  <div>
                    <div className="font-semibold">CP-ABE + PRE</div>
                    <div className="text-white/70 text-xs">Cryptographic access control</div>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/30"></div>
                <div className="flex items-center gap-x-2">
                  <span className="text-emerald-300">🌐</span>
                  <div>
                    <div className="font-semibold">IPFS Storage</div>
                    <div className="text-white/70 text-xs">Decentralized &amp; permanent</div>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/30"></div>
                <div className="flex items-center gap-x-2">
                  <span className="text-emerald-300">⛓️</span>
                  <div>
                    <div className="font-semibold">Blockchain Log</div>
                    <div className="text-white/70 text-xs">100% transparent audit trail</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="md:col-span-5 relative">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Mock dashboard preview */}
                  <div className="text-center">
                    <div className="flex justify-center gap-8 mb-6">
                      <div className="text-6xl">📋</div>
                      <div className="text-6xl">👩‍⚕️</div>
                      <div className="text-6xl">🔑</div>
                    </div>
                    <p className="text-white font-medium text-xl">Patient approves access</p>
                    <p className="text-emerald-300 text-sm mt-2">Time-bound • Revocable • Logged on-chain</p>
                    
                    {/* Fake progress */}
                    <div className="mt-8 w-3/4 mx-auto h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-white/70 mt-3 flex justify-between">
                      <span>Access granted</span>
                      <span>Expires in 48 hours</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 bg-white text-emerald-700 text-xs font-bold px-4 py-2 rounded-3xl shadow-xl flex items-center gap-x-1 rotate-12">
                ✅ Patient Controlled
              </div>
              <div className="absolute -bottom-4 -left-6 bg-white text-slate-800 text-xs font-bold px-4 py-2 rounded-3xl shadow-xl flex items-center gap-x-1 -rotate-12">
                ⛓️ On-chain transparency
              </div>
            </div>
          </div>
        </header>

        {/* PROJECT DESCRIPTION SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-semibold text-slate-900 tracking-tight">
                Secure, Patient-Controlled Medical Record Sharing
              </h2>
              <div className="mt-8 prose prose-lg text-slate-600">
                <p className="text-xl">
                  SecureMed lets patients securely store and share their medical records while maintaining full control.
                </p>
                <p className="mt-6">
                  It uses <strong>CP-ABE (Ciphertext-Policy Attribute-Based Encryption)</strong> to ensure only eligible doctors can even request access. 
                  <strong>Proxy Re-Encryption (PRE)</strong> then allows patients to grant time-bound, revocable access to specific records.
                </p>
                <p className="mt-6">
                  All files are stored on <strong>IPFS</strong> for decentralized availability and censorship resistance, while every action — upload, request, approval, access, and revocation — is immutably logged on a public blockchain for complete transparency and auditability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY HIGHLIGHTS */}
        <section id="technology" className="py-20 bg-slate-100">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="text-center mb-12">
              <span className="px-4 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-3xl">Core Technology Stack</span>
              <h2 className="text-4xl font-semibold mt-4">Built for privacy by design</h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {/* CP-ABE */}
              <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition-shadow border border-transparent hover:border-emerald-200">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="font-semibold text-xl">CP-ABE</h3>
                <p className="text-slate-600 mt-3">
                  Doctors must prove they satisfy the patient’s access policy (e.g., “cardiologist + licensed in California”) before they can even request a record.
                </p>
              </div>

              {/* PRE */}
              <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition-shadow border border-transparent hover:border-emerald-200">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="font-semibold text-xl">Proxy Re-Encryption</h3>
                <p className="text-slate-600 mt-3">
                  Patients grant temporary, targeted access without ever sharing their private keys. Access automatically expires.
                </p>
              </div>

              {/* IPFS */}
              <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition-shadow border border-transparent hover:border-emerald-200">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="font-semibold text-xl">IPFS Storage</h3>
                <p className="text-slate-600 mt-3">
                  Medical files are stored in a decentralized network. Content-addressed, tamper-proof, and globally accessible.
                </p>
              </div>

              {/* Blockchain */}
              <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition-shadow border border-transparent hover:border-emerald-200">
                <div className="text-4xl mb-4">⛓️</div>
                <h3 className="font-semibold text-xl">Blockchain Ledger</h3>
                <p className="text-slate-600 mt-3">
                  Every upload, access request, approval, and revocation is recorded permanently and transparently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARDS TEASER */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-semibold">Three intuitive dashboards</h2>
              <p className="text-slate-600 mt-4 max-w-md mx-auto">
                Designed for the people who use it — no login required to explore what each role sees
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Patient Dashboard Card */}
              <div className="group border border-slate-200 hover:border-emerald-300 rounded-3xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-pink-600 text-sm font-bold tracking-widest">PATIENT</span>
                      <h3 className="text-2xl font-semibold mt-2">Your Records, Your Control</h3>
                    </div>
                    <span className="text-5xl">👤</span>
                  </div>
                  <ul className="mt-8 space-y-4 text-slate-600">
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Upload &amp; organize records</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Approve or deny doctor requests</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Set time limits &amp; revoke access</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> View on-chain activity log</li>
                  </ul>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-10 text-sm font-medium text-pink-600 group-hover:underline"
                  >
                    Preview Patient Dashboard →
                  </button>
                </div>
              </div>

              {/* Doctor Dashboard Card */}
              <div className="group border border-slate-200 hover:border-emerald-300 rounded-3xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-blue-600 text-sm font-bold tracking-widest">DOCTOR</span>
                      <h3 className="text-2xl font-semibold mt-2">Request &amp; Access Securely</h3>
                    </div>
                    <span className="text-5xl">👩‍⚕️</span>
                  </div>
                  <ul className="mt-8 space-y-4 text-slate-600">
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Browse patient records you’re eligible for</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Submit CP-ABE verified access requests</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> View only PRE-decrypted files</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> See expiration timers</li>
                  </ul>
                  <button onClick={() => navigate("/doctor")} className="mt-10 text-sm font-medium text-blue-600 group-hover:underline">Preview Doctor Dashboard →</button>
                </div>
              </div>

              {/* Admin Dashboard Card */}
              <div className="group border border-slate-200 hover:border-emerald-300 rounded-3xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-amber-600 text-sm font-bold tracking-widest">ADMIN</span>
                      <h3 className="text-2xl font-semibold mt-2">System Oversight &amp; Compliance</h3>
                    </div>
                    <span className="text-5xl">🛠️</span>
                  </div>
                  <ul className="mt-8 space-y-4 text-slate-600">
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Monitor network-wide activity</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Manage users &amp; attribute policies</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Generate compliance reports</li>
                    <li className="flex gap-3 items-center"><span className="text-emerald-400">✓</span> Audit blockchain logs</li>
                  </ul>
                  
                  <button
  onClick={() => navigate("/admin")}
  className="mt-10 text-sm font-medium text-amber-600 hover:underline"
>
  Preview Admin Dashboard →
</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES / BENEFITS */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-semibold">Real-world impact</h2>
                <div className="mt-10 space-y-8">
                  <div className="flex gap-6">
                    <div className="text-4xl">🏥</div>
                    <div>
                      <h4 className="font-semibold text-lg">Emergency care</h4>
                      <p className="text-slate-400">Instant temporary access granted by patient to ER doctors — no paperwork delays.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-4xl">🔬</div>
                    <div>
                      <h4 className="font-semibold text-lg">Second opinions</h4>
                      <p className="text-slate-400">Patients share specific test results with specialists for a limited time window.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-4xl">📈</div>
                    <div>
                      <h4 className="font-semibold text-lg">Chronic condition management</h4>
                      <p className="text-slate-400">Ongoing monitored access for care teams with automatic revocation when no longer needed.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8">
                <div className="text-emerald-300 text-sm font-medium mb-2">DID YOU KNOW?</div>
                <p className="text-2xl leading-tight">
                  Traditional EHR systems expose millions of records every year. 
                  SecureMed gives patients cryptographic ownership and eliminates single points of failure.
                </p>
                <div className="mt-8 text-xs flex items-center gap-2 text-slate-400">
                  <span className="px-3 py-1 bg-white/20 rounded-3xl">HIPAA + GDPR ready</span>
                  <span className="px-3 py-1 bg-white/20 rounded-3xl">Zero-knowledge proofs</span>
                  <span className="px-3 py-1 bg-white/20 rounded-3xl">End-to-end encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <div className="py-16 bg-emerald-600 text-white text-center">
          <div className="max-w-screen-2xl mx-auto px-8">
            <h2 className="text-4xl font-semibold">Ready to take control of your health data?</h2>
            <p className="mt-4 text-lg text-emerald-100 max-w-md mx-auto">
              Join the waitlist or login to explore the full platform
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate("/login")} className="px-10 py-5 bg-white text-emerald-700 font-semibold rounded-3xl text-lg">Login to your dashboard</button>
              <button className="px-10 py-5 border border-white text-white font-semibold rounded-3xl text-lg hover:bg-white/10">Join the waitlist</button>
            </div>
            <p className="text-xs text-emerald-200 mt-8">Available for Patients • Doctors • Hospital Admins</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-screen-2xl mx-auto px-8 text-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-y-6">
              <div className="flex items-center gap-x-2 text-white">
                <span className="text-3xl">🛡️</span>
                <span className="font-bold text-2xl">SecureMed</span>
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                <a href="#" className="hover:text-white">Documentation</a>
                <a href="#" className="hover:text-white">Whitepaper (PDF)</a>
                <a href="#" className="hover:text-white">GitHub</a>
                <a href="#" className="hover:text-white">Blog</a>
                <a href="#" className="hover:text-white">Contact</a>
              </div>
              
              <div className="text-xs">© 2026 SecureMed • Decentralized. Private. Transparent.</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;