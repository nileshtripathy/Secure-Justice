import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import api from '../api/axios';

const STEPS = { EMAIL: 'email', RESET: 'reset', DONE: 'done' };

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Step 1: verify email exists ───────────────────────────── */
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify-email', { email });
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: submit new password ────────────────────────────── */
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── UI helpers ─────────────────────────────────────────────── */
  const inputClass =
    'appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all';

  const StepIndicator = ({ active, done, label, num }) => (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          done
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-primary-600 text-white ring-4 ring-primary-600/30'
            : 'bg-gray-700 text-gray-400'
        }`}
      >
        {done ? <CheckCircle className="h-4 w-4" /> : num}
      </div>
      <span className={`text-xs ${active ? 'text-primary-400' : done ? 'text-green-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-2xl">

        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-900/50 flex items-center justify-center rounded-xl border border-primary-500/30">
            <KeyRound className="h-7 w-7 text-primary-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Reset Password</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {step === STEPS.EMAIL && 'Enter your registered email to get started'}
            {step === STEPS.RESET && 'Choose a strong new password'}
            {step === STEPS.DONE && 'Your password has been updated!'}
          </p>
        </div>

        {/* Step indicator */}
        {step !== STEPS.DONE && (
          <div className="flex items-center justify-center gap-4">
            <StepIndicator num="1" label="Verify Email" active={step === STEPS.EMAIL} done={step === STEPS.RESET} />
            <div className={`h-px flex-1 max-w-[60px] ${step === STEPS.RESET ? 'bg-primary-500' : 'bg-gray-700'}`} />
            <StepIndicator num="2" label="New Password" active={step === STEPS.RESET} done={false} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── STEP 1: Email ───────────────────────────────────────── */}
        {step === STEPS.EMAIL && (
          <form className="mt-4 space-y-6" onSubmit={handleEmailSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                className={inputClass}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: New Password ─────────────────────────────────── */}
        {step === STEPS.RESET && (
          <form className="mt-4 space-y-5" onSubmit={handleResetSubmit}>
            {/* Email display (readonly) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                readOnly
                className={`${inputClass} opacity-60 cursor-default`}
                value={email}
              />
            </div>

            {/* New password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                required
                className={`${inputClass} pr-10`}
                placeholder="New password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                className={`${inputClass} pr-10`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength hint */}
            {newPassword && (
              <div className="space-y-1">
                {[
                  { label: 'At least 6 characters', ok: newPassword.length >= 6 },
                  { label: 'Contains a number', ok: /\d/.test(newPassword) },
                  { label: 'Contains a letter', ok: /[a-zA-Z]/.test(newPassword) },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span className={ok ? 'text-green-400' : 'text-gray-500'}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Resetting…
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* ── STEP 3: Done ────────────────────────────────────────── */}
        {step === STEPS.DONE && (
          <div className="text-center space-y-6 mt-4">
            <div className="mx-auto w-16 h-16 bg-green-900/40 border border-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Password reset successful!</p>
              <p className="text-gray-400 text-sm mt-1">
                Your password for <span className="text-primary-400">{email}</span> has been updated.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-lg text-white bg-primary-600 hover:bg-primary-700 font-medium text-sm transition-all shadow-lg shadow-primary-600/20"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Footer links */}
        {step !== STEPS.DONE && (
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
