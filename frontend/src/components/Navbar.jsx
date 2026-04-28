import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, LogOut, Search, LayoutDashboard, User, Menu, X, Bell } from 'lucide-react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetchUnread = () => {
      api.get('/notifications/unread-count')
        .then(res => setUnread(res.data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (path, label, Icon) => (
    <Link
      to={path}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(path)
          ? 'bg-primary-500/15 text-primary-300'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );

  return (
    <nav className="glass-panel sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Shield className="h-8 w-8 text-primary-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              SecureJustice
            </span>
          </Link>

          {/* Center Nav links - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/track', 'Track Case', Search)}
            {user && navLink('/dashboard', 'Dashboard', LayoutDashboard)}
          </div>

          {/* Right side - desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className={`relative p-2 rounded-full transition-all ${isActive('/notifications') ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/profile')
                      ? 'border-primary-500/50 bg-primary-500/15 text-primary-300'
                      : 'border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-primary-900/70 border border-primary-500/40 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-400" />
                  </div>
                  <span>{user.name}</span>
                  <span className="text-xs text-primary-400 capitalize">({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-primary-600/20">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-700/50 px-4 py-3 space-y-1">
          {navLink('/track', 'Track Case', Search)}
          {user && navLink('/dashboard', 'Dashboard', LayoutDashboard)}
          {user && navLink('/profile', 'My Profile', User)}
          {user && navLink('/notifications', `Notifications${unread > 0 ? ` (${unread})` : ''}`, Bell)}
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white text-sm font-medium">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
