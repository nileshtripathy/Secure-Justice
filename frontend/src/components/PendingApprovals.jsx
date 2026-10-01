import React, { useEffect, useState } from 'react';
import { UserCheck, Check, X, FileText } from 'lucide-react';
import api from '../api/axios';

// Admin-only: police / forensic / lawyer accounts must be approved before they can log in.
const PendingApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/auth/admin/pending');
      setUsers(res.data);
    } catch {
      setError('Could not load pending accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const review = async (id, action) => {
    setError('');
    try {
      await api.patch(`/auth/admin/users/${id}`, { action });
      setUsers((u) => u.filter((x) => x._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const viewFileText = async (id) => {
    const tab = window.open('', '_blank');
    try {
      const res = await api.get(`/auth/admin/users/${id}/id-card`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      if (tab) tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch {
      if (tab) tab.close();
      setError('Could not open the ID card.');
    }
  };

  if (loading) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-primary-400" /> Pending Account Approvals
        {users.length > 0 && <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{users.length}</span>}
      </h2>
      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm">No accounts are waiting for approval.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <div className="min-w-0">
                <p className="text-white font-medium">{u.name} <span className="text-xs text-primary-400 capitalize">({u.role})</span></p>
                <p className="text-gray-400 text-sm break-all">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.hasFileText && (
                  <button onClick={() => viewFileText(u._id)} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded">
                    <FileText className="h-4 w-4" /> ID card
                  </button>
                )}
                <button onClick={() => review(u._id, 'approve')} className="flex items-center gap-1 text-sm bg-green-700/40 hover:bg-green-700/60 text-green-200 border border-green-500/40 px-3 py-1.5 rounded">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => review(u._id, 'reject')} className="flex items-center gap-1 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 px-3 py-1.5 rounded">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
