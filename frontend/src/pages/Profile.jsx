import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Mail, Shield, Calendar, FileText, Activity, LogOut, CheckCircle, Clock } from 'lucide-react';

const roleColors = {
  citizen:  { bg: 'bg-blue-900/40',   border: 'border-blue-500/30',   text: 'text-blue-400'   },
  police:   { bg: 'bg-yellow-900/40', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  forensic: { bg: 'bg-purple-900/40', border: 'border-purple-500/30', text: 'text-purple-400' },
  lawyer:   { bg: 'bg-cyan-900/40',   border: 'border-cyan-500/30',   text: 'text-cyan-400'   },
  admin:    { bg: 'bg-red-900/40',    border: 'border-red-500/30',    text: 'text-red-400'    },
  judge:    { bg: 'bg-amber-900/40',  border: 'border-amber-500/30',  text: 'text-amber-400'  },
};

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/fir').then(res => setFirs(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const role = user.role || 'citizen';
  const rc = roleColors[role] || roleColors.citizen;

  const pending = firs.filter(f => f.status === 'pending').length;
  const active  = firs.filter(f => ['verified','investigating'].includes(f.status)).length;
  const closed  = firs.filter(f => f.status === 'closed').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left - Identity Card */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary-900/50 border-2 border-primary-500/30 flex items-center justify-center">
              <User className="h-10 w-10 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${rc.bg} ${rc.border} ${rc.text}`}>
              <Shield className="h-4 w-4" />
              <span className="capitalize">{role}</span>
            </div>
            <div className="pt-2 border-t border-gray-700/50">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'N/A'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded-xl font-medium transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right - Stats + Recent Cases */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-white">{firs.length}</p>
              <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1"><Activity className="h-3 w-3" /> Total Cases</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-yellow-400">{pending}</p>
              <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Pending</p>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-400">{closed}</p>
              <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Closed</p>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-400" /> My Recent Cases
            </h3>
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
            ) : firs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No cases filed yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {firs.slice(0, 8).map(fir => (
                  <button
                    key={fir._id}
                    onClick={() => navigate(`/fir/${fir._id}`)}
                    className="w-full text-left flex justify-between items-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/40 hover:border-primary-500/30 transition-all group"
                  >
                    <div className="overflow-hidden">
                      <p className="text-white text-sm font-medium truncate group-hover:text-primary-300 transition-colors">{fir.complaintText}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{fir.crimeType} · {fir.location}</p>
                    </div>
                    <span className={`ml-4 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      fir.status === 'pending'       ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                      fir.status === 'verified'      ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' :
                      fir.status === 'investigating' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                                                       'bg-green-900/30 text-green-400 border border-green-500/30'
                    }`}>{fir.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-400 w-24">Full Name</span>
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-400 w-24">Email</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-400 w-24">Role</span>
                <span className={`capitalize font-medium ${rc.text}`}>{role}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
