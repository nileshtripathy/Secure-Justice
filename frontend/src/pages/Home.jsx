import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Search, BarChart2, Lock, Clock, CheckCircle, Users, Gavel, Microscope, UserCheck, Scale, ArrowRight, ChevronDown } from 'lucide-react';

// Tailwind only generates classes it can find as complete strings in the source,
// so colour variants are listed explicitly (dynamic `bg-${color}-900` never works).
const TONES = {
  primary: { box: 'bg-primary-900/50 border-primary-500/20', icon: 'text-primary-400', step: 'bg-primary-900/60 border-primary-500/30 text-primary-400' },
  blue:    { box: 'bg-blue-900/50 border-blue-500/20',       icon: 'text-blue-400',    step: 'bg-blue-900/60 border-blue-500/30 text-blue-400' },
  cyan:    { box: 'bg-cyan-900/50 border-cyan-500/20',       icon: 'text-cyan-400',    step: 'bg-cyan-900/60 border-cyan-500/30 text-cyan-400' },
  purple:  { box: 'bg-purple-900/50 border-purple-500/20',   icon: 'text-purple-400',  step: 'bg-purple-900/60 border-purple-500/30 text-purple-400' },
  yellow:  { box: 'bg-yellow-900/50 border-yellow-500/20',   icon: 'text-yellow-400',  step: 'bg-yellow-900/60 border-yellow-500/30 text-yellow-400' },
  green:   { box: 'bg-green-900/50 border-green-500/20',     icon: 'text-green-400',   step: 'bg-green-900/60 border-green-500/30 text-green-400' },
};

const scrollToFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });

const Section = ({ id, className = '', children }) => (
  <section id={id} className={`py-24 px-4 ${className}`}>{children}</section>
);

const SectionLabel = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 font-medium text-sm mb-4">
    {children}
  </div>
);

const FEATURES = [
  { icon: FileText, tone: 'primary', title: 'Digital FIR Filing', desc: 'Citizens can file First Information Reports online from anywhere, with an auto-generated, trackable Case Number.' },
  { icon: Lock, tone: 'blue', title: 'Tamper-Evident Evidence', desc: 'Every file is SHA-256 hashed at upload. Authorized users can re-verify a file against its original hash at any time.' },
  { icon: Search, tone: 'cyan', title: 'Public Case Tracking', desc: 'Anyone with a Case Number can check the current status and activity timeline of a complaint. No personal details are shown.' },
  { icon: BarChart2, tone: 'purple', title: 'Analytics Dashboard', desc: 'Police and admins get case totals, status breakdowns and crime-type counts.' },
  { icon: Clock, tone: 'yellow', title: 'Full Audit Trail', desc: 'Status changes, assignments, evidence uploads and integrity checks are logged with timestamps and who performed them.' },
  { icon: Gavel, tone: 'green', title: 'Role-Based Access', desc: 'Citizens, police, forensic experts, lawyers, judges and admins each see only what they are permitted to.' },
];

const STEPS = [
  { step: '01', tone: 'primary', title: 'File a Complaint Online', desc: 'A citizen registers and files an FIR with the incident details. A Case Number is issued instantly.' },
  { step: '02', tone: 'blue', title: 'Police Verification & Assignment', desc: 'Police review the FIR, update its status and take ownership of the case.' },
  { step: '03', tone: 'purple', title: 'Evidence Collection & Upload', desc: 'Police and forensic experts upload evidence. Each file is hashed with SHA-256 for integrity checks.' },
  { step: '04', tone: 'cyan', title: 'Forensic Analysis', desc: 'Forensic experts verify evidence integrity and discuss findings with the case team through secure messaging.' },
  { step: '05', tone: 'yellow', title: 'Court Review & Judgment', desc: 'A judge reviews the case file and audit trail and records the judgment. Participants are notified.' },
];

const ROLES = [
  { icon: UserCheck, tone: 'blue', role: 'Citizens', desc: 'File FIRs online (optionally anonymously), track progress and receive real-time updates.' },
  { icon: ShieldCheck, tone: 'primary', role: 'Police Authorities', desc: 'Review complaints, take ownership of cases, update status, upload evidence and view analytics.' },
  { icon: Microscope, tone: 'purple', role: 'Forensic Experts', desc: 'Upload evidence and verify its integrity against the original hash.' },
  { icon: Scale, tone: 'cyan', role: 'Lawyers', desc: 'Review case materials and follow the audit trail within a structured workflow.' },
  { icon: Gavel, tone: 'yellow', role: 'Judges', desc: 'Review complete case files and record the final judgment.' },
  { icon: BarChart2, tone: 'green', role: 'Administrators', desc: 'Approve staff accounts and monitor system-wide analytics.' },
];

const HIGHLIGHTS = [
  { icon: Lock, label: 'Evidence Integrity', value: 'SHA-256' },
  { icon: Users, label: 'User Roles', value: '6 stakeholder types' },
  { icon: Clock, label: 'Case Updates', value: 'Real-time' },
];

const Home = () => (
  <div className="w-full overflow-x-hidden">
    {/* HERO */}
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/6 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-[250px] h-[250px] bg-purple-600/15 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Transforming the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-blue-400 to-purple-500">Criminal Justice</span>{' '}
          System
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          A unified platform for FIR registration, digital evidence management, forensic review and court records, with an audit trail for every action.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-600/30 text-lg flex items-center justify-center gap-2 group">
            Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/track" className="bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-lg flex items-center justify-center gap-2">
            <Search className="h-5 w-5" /> Track a Case
          </Link>
          <button onClick={scrollToFeatures} className="text-gray-400 hover:text-white flex items-center justify-center gap-1 text-sm transition-colors">
            Learn more <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-20 flex flex-wrap justify-center gap-4">
        {HIGHLIGHTS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-900/50 border border-primary-500/30 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* FEATURES */}
    <Section id="features" className="bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><ShieldCheck className="h-4 w-4" /> Core Features</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">Everything you need, in one platform</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">Designed around the real workflow of a case, from filing to judgment.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, tone, title, desc }) => (
            <div key={title} className="glass-panel p-7 rounded-2xl text-left hover:-translate-y-1 transition-transform duration-300 group">
              <div className={`${TONES[tone].box} w-12 h-12 rounded-xl flex items-center justify-center border mb-5`}>
                <Icon className={`${TONES[tone].icon} h-6 w-6`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* HOW IT WORKS */}
    <Section id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><CheckCircle className="h-4 w-4" /> Simple Process</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">How SecureJustice Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">From filing a complaint to case resolution, a transparent digital-first journey.</p>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/60 via-blue-500/40 to-transparent hidden md:block" />
          <div className="space-y-10">
            {STEPS.map(({ step, tone, title, desc }) => (
              <div key={step} className="flex gap-8 items-start">
                <div className={`shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-sm z-10 ${TONES[tone].step}`}>{step}</div>
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

    {/* ROLES */}
    <Section className="bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel><Users className="h-4 w-4" /> For Everyone</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4">Built for All Stakeholders</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">Every participant in the process works under one secure roof.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.map(({ icon: Icon, tone, role, desc }) => (
            <div key={role} className="glass-panel p-7 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${TONES[tone].box}`}>
                <Icon className={`h-7 w-7 ${TONES[tone].icon}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{role}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* SECURITY */}
    <Section>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel><Lock className="h-4 w-4" /> Security First</SectionLabel>
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">Built with security in mind</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Evidence files are fingerprinted with SHA-256 so any change to a file can be detected. Sessions use signed JWTs, passwords are hashed with bcrypt, and every request is checked against the user&apos;s role and the case they are allowed to see.
            </p>
            <div className="space-y-4">
              {[
                { title: 'SHA-256 Evidence Hashing', desc: 'Each file gets a hash at upload; verification recomputes it and compares.' },
                { title: 'JWT Authentication + OTP', desc: 'Registration is confirmed by an emailed one-time code; passwords are never stored in plain text.' },
                { title: 'Role-Based Access Control', desc: 'Roles and case ownership are enforced on the server for every request.' },
                { title: 'Full Audit Logging', desc: 'Actions on a case are recorded with who did them and when.' },
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
            <p className="text-xs text-gray-500 uppercase tracking-wider">Illustration</p>
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 font-mono mb-1">SHA-256 Hash Verification</p>
              <p className="text-green-400 font-mono text-xs break-all">ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">Hash matches: file unchanged</span>
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 font-mono mb-2">Case Audit Log</p>
              {['FIR Filed', 'Assigned to an officer', 'Evidence uploaded', 'Status updated to investigating'].map((log) => (
                <div key={log} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                  <p className="text-gray-300 text-xs">{log}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>

    {/* CTA */}
    <Section className="bg-gray-900/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="glass-panel p-16 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-purple-900/20 pointer-events-none" />
          <div className="relative z-10">
            <ShieldCheck className="h-16 w-16 text-primary-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to bring justice into the digital age?</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Create an account to file and follow a case, or track one right now with its Case Number.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 group">
                Create Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/track" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                <Search className="h-5 w-5" /> Track a Case
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>

    <footer className="border-t border-gray-800 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary-500" />
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">SecureJustice</span>
        </div>
        <p className="text-gray-500 text-sm text-center">© {new Date().getFullYear()} SecureJustice. Built for transparency and integrity in the justice process.</p>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link to="/track" className="hover:text-white transition-colors">Track Case</Link>
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="hover:text-white transition-colors">Register</Link>
        </div>
      </div>
    </footer>
  </div>
);

export default Home;
