import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FirDetails from './pages/FirDetails';
import TrackCase from './pages/TrackCase';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';

import { ShieldCheck, FileText, Upload, Search, BarChart2, Lock, Clock, CheckCircle, Users, Gavel, Microscope, UserCheck, Scale, ArrowRight, ChevronDown } from 'lucide-react';

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`py-24 px-4 ${className}`}>{children}</section>
);

const SectionLabel = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 font-medium text-sm mb-4">
    {children}
  </div>
);

const Home = () => (
  <div className="w-full overflow-x-hidden">

    {/* ── HERO ────────────────────────────────────────────── */}
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/6 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-[250px] h-[250px] bg-purple-600/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <button 
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative inline-flex items-center justify-center mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
          <div className="relative flex items-center gap-3 px-6 py-2 bg-gray-900/90 border border-white/10 rounded-full backdrop-blur-xl leading-none">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            </span>
            <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
              Pioneering <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">Digital Justice</span> Solutions
            </span>
            <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300 ml-1" />
          </div>
        </button>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Transforming the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-blue-400 to-purple-500">
            Criminal Justice
          </span>{' '}
          System
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          A unified, tamper-proof platform integrating FIR registration, digital evidence management, forensic analysis, and court review — all in one secure ecosystem.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-600/30 text-lg flex items-center justify-center gap-2 group">
            Get Started Free <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/track" className="bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-lg flex items-center justify-center gap-2">
            <Search className="h-5 w-5" /> Track a Case
          </Link>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-gray-400 hover:text-white flex items-center justify-center gap-1 text-sm transition-colors"
          >
            Learn more <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </div>

      {/* Floating stat pills */}
      <div className="relative z-10 mt-20 flex flex-wrap justify-center gap-4">
        {[
          { icon: FileText, label: 'FIRs Registered', value: '10,000+', color: 'primary' },
          { icon: Lock, label: 'Evidence Secured', value: '99.9% Integrity', color: 'blue' },
          { icon: Clock, label: 'Avg. Response Time', value: '< 2 hours', color: 'purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-${color}-900/50 border border-${color}-500/30 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 text-${color}-400`} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── FEATURES ────────────────────────────────────────── */}
    <Section id="features" className="bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><ShieldCheck className="h-4 w-4" /> Core Features</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">Everything you need, in one platform</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">Designed to solve real-world problems in the justice system — from filing to verdict.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: FileText, color: 'primary', title: 'Digital FIR Filing', desc: 'Citizens can file First Information Reports online from anywhere. No more long queues or paperwork. Instant confirmation with a trackable Case Number.' },
            { icon: Lock, color: 'blue', title: 'Immutable Evidence', desc: 'All digital evidence is SHA-256 hashed before storage. Forensic experts can verify integrity at any time, ensuring it holds up in court.' },
            { icon: Search, color: 'cyan', title: 'Public Case Tracking', desc: 'Anyone with a Case Number can check the real-time status of their complaint — Pending, Investigating, Verified, or Closed.' },
            { icon: BarChart2, color: 'purple', title: 'Analytics Dashboard', desc: 'Police authorities and admins get powerful analytics — total cases, pending FIRs by area, crime type breakdown, and trend insights.' },
            { icon: Clock, color: 'yellow', title: 'Full Audit Trail', desc: 'Every action on a case — status changes, evidence uploads, assignments — is permanently logged with timestamps and officer identity.' },
            { icon: Gavel, color: 'green', title: 'Role-Based Access', desc: 'Citizen, Police, Forensic Expert, Lawyer, Judge, and Admin roles each see only what they are permitted to — ensuring strict data governance.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="glass-panel p-7 rounded-2xl text-left hover:-translate-y-1 transition-transform duration-300 group">
              <div className={`bg-${color}-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-${color}-500/20 mb-5`}>
                <Icon className={`text-${color}-400 h-6 w-6`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* ── HOW IT WORKS ────────────────────────────────────── */}
    <Section id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><CheckCircle className="h-4 w-4" /> Simple Process</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">How SecureJustice Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">From filing a complaint to case resolution — a transparent, digital-first journey.</p>
        </div>
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/60 via-blue-500/40 to-transparent hidden md:block" />
          <div className="space-y-10">
            {[
              { step: '01', color: 'primary', title: 'File a Complaint Online', desc: 'A citizen registers on SecureJustice and files an FIR with all incident details — location, crime type, and description. An auto-generated Case Number is issued instantly.' },
              { step: '02', color: 'blue', title: 'Police Verification & Assignment', desc: 'The FIR is reviewed by the assigned police authority. They verify the complaint, update the status, and assign an investigating officer to the case.' },
              { step: '03', color: 'purple', title: 'Evidence Collection & Upload', desc: 'Police officers and forensic experts securely upload digital evidence — CCTV footage, photographs, reports. Each file is hashed with SHA-256 to ensure integrity.' },
              { step: '04', color: 'cyan', title: 'Forensic Analysis', desc: 'Forensic experts access the case evidence, perform analysis, and submit their findings directly on the platform. Lawyers can review materials assigned to them.' },
              { step: '05', color: 'yellow', title: 'Court Review & Verdict', desc: 'Judges access complete case files including evidence and audit logs. The case is reviewed transparently and a verdict is recorded. Citizens are notified instantly.' },
            ].map(({ step, color, title, desc }) => (
              <div key={step} className="flex gap-8 items-start">
                <div className={`shrink-0 w-12 h-12 rounded-2xl bg-${color}-900/60 border border-${color}-500/30 flex items-center justify-center text-${color}-400 font-bold text-sm z-10`}>
                  {step}
                </div>
                <div className="glass-panel p-6 rounded-2xl flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>

    {/* ── WHO USES IT ─────────────────────────────────────── */}
    <Section className="bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><Users className="h-4 w-4" /> For Everyone</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">Built for All Stakeholders</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">SecureJustice connects every participant in the justice system under one secure roof.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: UserCheck, color: 'blue', role: 'Citizens', desc: 'File FIRs online, track case progress with a Case Number, and receive real-time updates — no physical visit required.' },
            { icon: ShieldCheck, color: 'primary', role: 'Police Authorities', desc: 'Review and verify complaints, assign officers, update case status, upload field evidence, and monitor analytics across all cases.' },
            { icon: Microscope, color: 'purple', role: 'Forensic Experts', desc: 'Upload forensic reports and evidence with full cryptographic traceability. Verify digital evidence integrity at any point.' },
            { icon: Scale, color: 'cyan', role: 'Lawyers', desc: 'Access assigned case materials, review evidence, follow audit trails, and collaborate effectively within a structured workflow.' },
            { icon: Gavel, color: 'yellow', role: 'Judges', desc: 'Review complete case files with documented evidence chains and audit logs, ensuring fully informed and fair rulings.' },
            { icon: BarChart2, color: 'green', role: 'Administrators', desc: 'Manage users across all roles, view system-wide analytics, monitor performance, and maintain platform integrity.' },
          ].map(({ icon: Icon, color, role, desc }) => (
            <div key={role} className="glass-panel p-7 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-14 h-14 rounded-2xl bg-${color}-900/50 border border-${color}-500/20 flex items-center justify-center mb-5`}>
                <Icon className={`h-7 w-7 text-${color}-400`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* ── STATS ───────────────────────────────────────────── */}
    <Section>
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-blue-900/20 pointer-events-none" />
          <div className="relative z-10 text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-3">Trusted by the Justice System</h2>
            <p className="text-gray-400 text-lg">Real numbers, real impact.</p>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'FIRs Filed', color: 'text-primary-400' },
              { value: '99.9%', label: 'Evidence Integrity', color: 'text-blue-400' },
              { value: '6', label: 'User Roles Supported', color: 'text-purple-400' },
              { value: '< 2h', label: 'Avg. Response Time', color: 'text-cyan-400' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <p className={`text-4xl font-extrabold ${color} mb-1`}>{value}</p>
                <p className="text-gray-400 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>

    {/* ── SECURITY ────────────────────────────────────────── */}
    <Section className="bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel><Lock className="h-4 w-4" /> Security First</SectionLabel>
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
              Built with Uncompromising Security
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Every piece of evidence uploaded to SecureJustice is cryptographically fingerprinted using SHA-256 hashing. Tampering is mathematically impossible to hide. All data is protected by JWT-based authentication and strict role-based access control.
            </p>
            <div className="space-y-4">
              {[
                { title: 'SHA-256 Evidence Hashing', desc: 'Every uploaded file gets a unique cryptographic hash that permanently proves its authenticity.' },
                { title: 'JWT Authentication', desc: 'All sessions are secured with signed JSON Web Tokens — no stored passwords are ever exposed.' },
                { title: 'Role-Based Access Control', desc: 'Each user role sees only the data they are authorized for — no data leakage between roles.' },
                { title: 'Full Audit Logging', desc: 'Every action on every case is recorded with who did it and when — complete accountability.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-8 rounded-3xl space-y-4">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 font-mono mb-1">SHA-256 Hash Verification</p>
              <p className="text-green-400 font-mono text-xs break-all">3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">VERIFIED — Integrity intact</span>
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 font-mono mb-2">Case Audit Log</p>
              {['FIR Filed by Rahul Sharma (citizen)', 'Assigned to Inspector D. Patel (police)', 'Evidence uploaded — CCTV.mp4', 'Status → Investigating'].map((log, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                  <p className="text-gray-300 text-xs">{log}</p>
                </div>
              ))}
            </div>
            <div className="bg-primary-900/40 border border-primary-500/30 rounded-xl p-4 text-center">
              <Lock className="h-6 w-6 text-primary-400 mx-auto mb-1" />
              <p className="text-primary-300 font-semibold text-sm">All data encrypted in transit & at rest</p>
            </div>
          </div>
        </div>
      </div>
    </Section>

    {/* ── CTA ─────────────────────────────────────────────── */}
    <Section>
      <div className="max-w-4xl mx-auto text-center">
        <div className="glass-panel p-16 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-purple-900/20 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary-600/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <ShieldCheck className="h-16 w-16 text-primary-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Ready to bring justice into the digital age?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of citizens, officers, and justice professionals already using SecureJustice to make the system faster, fairer, and fully transparent.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 group"
              >
                Create Free Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/track"
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" /> Track a Case
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>

    {/* ── FOOTER ──────────────────────────────────────────── */}
    <footer className="border-t border-gray-800 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary-500" />
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">SecureJustice</span>
        </div>
        <p className="text-gray-500 text-sm text-center">© {new Date().getFullYear()} SecureJustice. Built to deliver transparency and integrity in the justice system.</p>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link to="/track" className="hover:text-white transition-colors">Track Case</Link>
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="hover:text-white transition-colors">Register</Link>
        </div>
      </div>
    </footer>

  </div>
);

const AppRoutes = () => {
    return (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fir/:id" element={<FirDetails />} />
          <Route path="/track" element={<TrackCase />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
    )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-dark-900">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
