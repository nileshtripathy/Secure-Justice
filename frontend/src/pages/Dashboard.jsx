import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Upload, Activity, ShieldAlert, CheckCircle, Clock, Search, Filter, BarChart2, AlertCircle, Copy, Hash, EyeOff, Trash2 } from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [firs, setFirs] = useState([]);
  const [showFirModal, setShowFirModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [crimeType, setCrimeType] = useState('Theft');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // New State for Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [newCaseNumber, setNewCaseNumber] = useState('');  // shown in success banner
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchFirs = async () => {
    try {
      const res = await api.get('/fir');
      setFirs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (['admin', 'police'].includes(user?.role)) {
        const res = await api.get('/fir/analytics');
        setAnalytics(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFirs();
    fetchAnalytics();
  }, [user]);

  const filteredFirs = firs.filter(fir => {
    const matchesSearch = fir.complaintText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          fir.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || fir.status === filterStatus.toLowerCase();
    const matchesType = filterType === 'All' || fir.crimeType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmitFir = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/fir', { complaintText, crimeType, location, isAnonymous });
      setShowFirModal(false);
      setComplaintText('');
      setLocation('');
      setIsAnonymous(false);
      setNewCaseNumber(res.data.caseNumber || '');
      fetchFirs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (firId) => {
    setDeleteError('');
    try {
      await api.delete(`/fir/${firId}`);
      setDeletingId(null);
      fetchFirs();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete. Please try again.');
    }
  };

  if(!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user.name} ({user.role})</p>
        </div>
        {user.role === 'citizen' && (
          <button onClick={() => { setShowFirModal(true); setNewCaseNumber(''); }} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary-600/20">
            <FileText className="h-5 w-5" />
            File New FIR
          </button>
        )}
      </div>

      {/* Success banner after FIR filed */}
      {newCaseNumber && (
        <div className="glass-panel mb-6 p-4 rounded-xl border border-green-500/30 bg-green-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-green-300 font-semibold text-sm mb-0.5">✅ FIR Filed Successfully!</p>
            <p className="text-gray-400 text-xs">Save your Case Number to track status anytime:</p>
            <div className="flex items-center gap-2 mt-1">
              <Hash className="h-4 w-4 text-green-400" />
              <span className="text-white font-mono font-bold text-lg tracking-widest">{newCaseNumber}</span>
            </div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(newCaseNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 bg-green-700/40 hover:bg-green-700/60 text-green-200 border border-green-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Number'}
          </button>
        </div>
      )}

      {/* Analytics Section for Police/Admin */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="bg-primary-900/50 p-3 rounded-lg text-primary-400">
               <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Cases</p>
              <h3 className="text-2xl font-bold text-white">{analytics.totalFIRs}</h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="bg-yellow-900/50 p-3 rounded-lg text-yellow-500">
               <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <h3 className="text-2xl font-bold text-white">{analytics.pendingFIRs}</h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="bg-blue-900/50 p-3 rounded-lg text-blue-500">
               <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Verified</p>
              <h3 className="text-2xl font-bold text-white">{analytics.verifiedFIRs}</h3>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="bg-purple-900/50 p-3 rounded-lg text-purple-400">
               <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Crime Categories</p>
              <h3 className="text-2xl font-bold text-white">{analytics.crimeTypes.length}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by details or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Investigating">Investigating</option>
            <option value="Closed">Closed</option>
          </select>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="All">All Types</option>
            <option value="Theft">Theft</option>
            <option value="Cybercrime">Cybercrime</option>
            <option value="Fraud">Fraud</option>
            <option value="Violence">Violence</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-semibold text-white mb-2">Recent Cases</h2>
        {filteredFirs.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-xl">
             <ShieldAlert className="h-12 w-12 text-gray-500 mx-auto mb-4" />
             <p className="text-gray-400">No cases match your criteria.</p>
          </div>
        ) : (
          filteredFirs.map(fir => (
            <Link to={`/fir/${fir._id}`} key={fir._id} className="glass-panel p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-gray-800/80 hover:border-primary-500/30 block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="bg-primary-900/50 text-primary-400 px-2.5 py-0.5 rounded text-xs font-semibold border border-primary-500/20">
                    {fir.crimeType}
                  </span>
                  {fir.caseNumber && (
                    <span className="flex items-center gap-1 text-xs font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                      <Hash className="h-3 w-3 text-gray-500" />{fir.caseNumber}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{new Date(fir.date).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-1 line-clamp-1">{fir.complaintText}</h3>
                <p className="text-sm text-gray-400">📍 {fir.location}</p>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  fir.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30' :
                  fir.status === 'verified' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/30' :
                  fir.status === 'investigating' ? 'bg-purple-900/30 text-purple-500 border border-purple-500/30' :
                  'bg-green-900/30 text-green-500 border border-green-500/30'
                }`}>
                  {fir.status === 'pending' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3"/>}
                  <span className="capitalize">{fir.status}</span>
                </div>
                {/* Delete button — only for pending own cases (citizen) or admin/police */}
                {((['admin','police'].includes(user?.role)) ||
                  (user?.role === 'citizen' && fir.status === 'pending')) && (
                  <button
                    onClick={e => { e.preventDefault(); setDeleteError(''); setDeletingId(fir._id); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Delete case"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {showFirModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-4">File a new FIR</h2>
            <form onSubmit={handleSubmitFir} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Crime Type</label>
                  <select 
                    value={crimeType} onChange={e => setCrimeType(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option>Theft</option>
                    <option>Cybercrime</option>
                    <option>Fraud</option>
                    <option>Violence</option>
                    <option>Other</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input 
                    type="text" required value={location} onChange={e => setLocation(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Central Park, NY"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Complaint Description</label>
                  <textarea 
                    required value={complaintText} onChange={e => setComplaintText(e.target.value)} rows="4"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe the incident..."
                  ></textarea>
               </div>
               {/* Anonymous option */}
               <button
                 type="button"
                 onClick={() => setIsAnonymous(a => !a)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                   isAnonymous
                     ? 'bg-purple-900/40 border-purple-500/40 text-purple-300'
                     : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600'
                 }`}
               >
                 <EyeOff className="h-5 w-5" />
                 <div className="text-left">
                   <span className="font-medium text-sm block">{isAnonymous ? 'Anonymous Mode ON' : 'File Anonymously'}</span>
                   <span className="text-xs opacity-70">Hides your identity from police. For whistleblowers and sensitive cases.</span>
                 </div>
                 <div className={`ml-auto w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isAnonymous ? 'bg-purple-600' : 'bg-gray-700'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-4' : ''}`} />
                 </div>
               </button>
               <div className="flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setShowFirModal(false)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                  <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium">Submit FIR</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-red-500/20">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-900/40 border border-red-500/30 mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Delete this case?</h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              This action is permanent and cannot be undone. All associated logs will also be removed.
            </p>
            {deleteError && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-2 mb-4 text-center">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingId(null); setDeleteError(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
