import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-2xl">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-900/50 flex items-center justify-center rounded-xl border border-primary-500/30">
            <Shield className="h-8 w-8 text-primary-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to access SecureJustice
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password with show/hide toggle */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-700 bg-gray-800/50 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                id="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary-400 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg shadow-primary-600/20"
            >
              Sign in
            </button>
          </div>
          <p className="text-center text-sm text-gray-400">
            Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
