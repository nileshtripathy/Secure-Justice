import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import api from '../api/axios';

// ─── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-3 mb-6">
    {[1, 2].map((s) => (
      <React.Fragment key={s}>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
            step >= s
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/40'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {step > s ? <CheckCircle className="w-4 h-4" /> : s}
        </div>
        {s < 2 && (
          <div className={`h-0.5 w-12 rounded transition-all duration-500 ${step > 1 ? 'bg-primary-500' : 'bg-gray-700'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── OTP digit input ───────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = digits.slice();
      next[idx] = '';
      onChange(next.join(''));
      if (idx > 0) inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[idx] = char;
    onChange(next.join(''));
    if (char && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-3" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          id={`otp-digit-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-gray-800/60 text-white focus:outline-none transition-all duration-200 ${
            d
              ? 'border-primary-500 shadow-lg shadow-primary-500/20'
              : 'border-gray-700 focus:border-primary-500'
          }`}
        />
      ))}
    </div>
  );
};

// ─── Countdown timer ───────────────────────────────────────────────────────────
const useCountdown = (seconds) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  const start = () => {
    clearInterval(intervalRef.current);
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(intervalRef.current); return 0; }
        return r - 1;
      });
    }, 1000);
  };

  useEffect(() => { start(); return () => clearInterval(intervalRef.current); }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, expired: remaining === 0, restart: start };
};

// ─── Main Register component ───────────────────────────────────────────────────
const Register = () => {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [idCardFile, setIdCardFile] = useState(null);

  // Step 2 fields
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown always mounted at top level (hooks must not be called conditionally)
  const { display: countdownDisplay, expired: otpExpired, restart: restartCountdown } = useCountdown(300);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  /* Password strength */
  const hints = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ];
  const strength = hints.filter((h) => h.ok).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#eab308', '#22c55e'][strength];

  /* ── Step 1: send OTP ─────────────────────────────────────────────────────── */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (['police', 'forensic', 'lawyer'].includes(role) && !idCardFile) {
      setError('Please upload your ID Card / Badge.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      if (['police', 'forensic', 'lawyer'].includes(role) && idCardFile) {
        formData.append('idCard', idCardFile);
      }

      const res = await api.post('/auth/send-otp', formData);
      if (res.data.devMode) {
        setSuccessMsg('⚙️ Dev Mode: OTP printed to the backend console (terminal). Enter it below.');
      } else {
        setSuccessMsg(`✅ OTP sent to ${email}. Check your inbox (also check spam).`);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: verify OTP ───────────────────────────────────────────────────── */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      // Store token & set user via a silent login reuse
      localStorage.setItem('token', res.data.token);
      // Trigger auth context re-fetch by navigating (profile fetched on load)
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ────────────────────────────────────────────────────────────── */
  const handleResend = async (restart) => {
    setError('');
    setOtp('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      if (['police', 'forensic', 'lawyer'].includes(role) && idCardFile) {
        formData.append('idCard', idCardFile);
      }

      await api.post('/auth/send-otp', formData);
      setSuccessMsg('New OTP sent! Check your email.');
      restart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render Step 1 ─────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <form className="mt-6 space-y-5" onSubmit={handleSendOTP}>
      {error && <AlertBox type="error" msg={error} />}

      <div className="space-y-4">
        {/* Full Name */}
        <InputField
          id="register-name" icon={<User className="h-5 w-5 text-gray-500" />}
          type="text" placeholder="Full Name" value={name}
          onChange={(e) => setName(e.target.value)} required
        />

        {/* Email */}
        <InputField
          id="register-email" icon={<Mail className="h-5 w-5 text-gray-500" />}
          type="email" placeholder="Email address" value={email}
          onChange={(e) => setEmail(e.target.value)} required
        />

        {/* Password */}
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </span>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              required
              className="appearance-none rounded-lg w-full px-3 py-3 pl-10 pr-10 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              id="register-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary-400 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(strength / 3) * 100}%`, background: strengthColor }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {hints.map(({ label, ok }) => (
                  <span key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-400' : 'text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${ok ? 'bg-green-400' : 'bg-gray-600'}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role */}
        <select
          id="register-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="appearance-none rounded-lg w-full px-3 py-3 border border-gray-700 bg-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
        >
          <option value="citizen">Citizen</option>
          <option value="police">Police Authority</option>
          <option value="forensic">Forensic Expert</option>
          <option value="lawyer">Lawyer</option>
          <option value="admin">Admin</option>
        </select>

        {['police', 'forensic', 'lawyer'].includes(role) && (
          <div className="space-y-1">
            <label className="block text-sm text-gray-300 font-medium">Upload ID Card / Badge (Required)</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => setIdCardFile(e.target.files[0])}
              className="appearance-none rounded-lg w-full px-3 py-2 border border-gray-700 bg-gray-800/50 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-900 file:text-primary-300 hover:file:bg-primary-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        )}
      </div>

      <button
        id="register-send-otp-btn"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Send Verification OTP
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Login here</Link>
      </p>
    </form>
  );

  // ── Render Step 2 ─────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <form className="mt-6 space-y-6" onSubmit={handleVerifyOTP}>
      {successMsg && <AlertBox type="success" msg={successMsg} />}
      {error && <AlertBox type="error" msg={error} />}

      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-900/50 border border-primary-500/30 mb-2">
          <ShieldCheck className="w-7 h-7 text-primary-400" />
        </div>
        <p className="text-gray-300 text-sm">
          Enter the 6-digit code sent to <br />
          <span className="text-white font-semibold">{email}</span>
        </p>
      </div>

      <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} />

      <div className="text-center text-sm">
        {otpExpired ? (
          <span className="text-red-400">OTP expired. Please resend.</span>
        ) : (
          <span className="text-gray-400">
            Expires in <span className="text-primary-400 font-mono font-semibold">{countdownDisplay}</span>
          </span>
        )}
      </div>

      <button
        id="register-verify-otp-btn"
        type="submit"
        disabled={loading || otp.length < 6}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Verify &amp; Create Account
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          id="register-back-btn"
          onClick={() => { setStep(1); setError(''); setOtp(''); setSuccessMsg(''); }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Edit details
        </button>
        <button
          type="button"
          id="register-resend-btn"
          disabled={loading || !otpExpired}
          onClick={() => handleResend(restartCountdown)}
          className="flex items-center gap-1 text-primary-400 hover:text-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Resend OTP
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-2xl space-y-2">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 bg-primary-900/50 flex items-center justify-center rounded-xl border border-primary-500/30">
            <UserPlus className="h-7 w-7 text-primary-500" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-white">
            {step === 1 ? 'Create an Account' : 'Verify Your Email'}
          </h2>
          <p className="text-sm text-gray-400">
            {step === 1 ? 'Join SecureJustice platform' : 'We sent a code to your inbox'}
          </p>
        </div>

        <StepIndicator step={step} />

        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const InputField = ({ id, icon, type, placeholder, value, onChange, required }) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</span>
    <input
      id={id} type={type} required={required} value={value} onChange={onChange}
      placeholder={placeholder}
      className="appearance-none rounded-lg w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
    />
  </div>
);

const AlertBox = ({ type, msg }) => (
  <div className={`p-3 rounded-lg text-sm text-center border ${
    type === 'error'
      ? 'bg-red-900/30 border-red-500/50 text-red-200'
      : 'bg-green-900/30 border-green-500/50 text-green-200'
  }`}>
    {msg}
  </div>
);

export default Register;
