import React, { useState } from 'react';
import api from '../api/axios';
import { Search, CheckCircle, ShieldAlert, Calendar, FileText } from 'lucide-react';

const statusConfig = {
  pending:      { label: 'Pending Review',   color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  verified:     { label: 'Verified',         color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-500/30',   dot: 'bg-blue-400'   },
  investigating:{ label: 'Under Investigation', color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  forensic_review: { label: 'Forensic Review', color: 'text-cyan-400',  bg: 'bg-cyan-900/30',   border: 'border-cyan-500/30',   dot: 'bg-cyan-400'   },
  legal_review: { label: 'Legal Review',     color: 'text-amber-400',  bg: 'bg-amber-900/30',  border: 'border-amber-500/30',  dot: 'bg-amber-400'  },
  closed:       { label: 'Case Closed',      color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-500/30',  dot: 'bg-green-400'  },
};

const steps = ['pending', 'verified', 'investigating', 'forensic_review', 'legal_review', 'closed'];

const TrackCase = () => {
  const [caseId, setCaseId] = useState('');
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLogs([]);
    setLoading(true);

    try {
      // Public endpoint: needs no login and returns only non-sensitive fields + the activity timeline
      const res = await api.get(`/fir/track/${encodeURIComponent(caseId.trim().toUpperCase())}`);
      setResult(res.data);
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.response?.status === 429
        ? 'Too many searches. Please wait a few minutes and try again.'
        : 'Case not found. Please double-check the Case Number (e.g. FIR-2026-12345678) and try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = result ? steps.indexOf(result.status) : -1;
  const cfg = result ? (statusConfig[result.status] || statusConfig.pending) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-900/50 border border-primary-500/30 mb-4">
            <Search className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Track Your Case</h1>
          <p className="text-gray-400">Enter your <span className="text-primary-400 font-mono">Case Number</span> (e.g. <span className="font-mono bg-gray-800 text-white px-2 py-0.5 rounded">FIR-2026-12345678</span>) to get a live status update.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <input
            type="text"
            required
            value={caseId}
            onChange={e => setCaseId(e.target.value)}
            placeholder="e.g. FIR-2026-12345678"
            className="flex-1 px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-900/20 text-red-300 text-sm mb-6 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {result && cfg && (
          <div className="space-y-6">

            {/* Status Card */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-gray-500 font-mono">Case Number</span>
                  <p className="text-white font-mono text-sm">{result.caseNumber}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}></span>
                  {cfg.label}
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{result.crimeType} Complaint</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Filed {new Date(result.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-500">Complaint details are private to the people involved in the case.</p>
            </div>

            {/* Progress Stepper */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-6">Case Progress</h3>
              <div className="relative flex items-center justify-between">
                {/* Connector line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gray-700 top-5 z-0"></div>
                <div
                  className="absolute left-0 h-0.5 bg-primary-500 top-5 z-0 transition-all duration-700"
                  style={{ width: `${(Math.max(currentStepIndex, 0) / (steps.length - 1)) * 100}%` }}
                ></div>
                {steps.map((step, i) => {
                  const done = i <= currentStepIndex;
                  const active = i === currentStepIndex;
                  const sCfg = statusConfig[step];
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        done ? `${sCfg.bg} ${sCfg.border}` : 'bg-gray-800 border-gray-600'
                      } ${active ? 'shadow-lg shadow-primary-500/30 scale-110' : ''}`}>
                        {done
                          ? <CheckCircle className={`h-5 w-5 ${sCfg.color}`} />
                          : <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                        }
                      </div>
                      <span className={`text-xs font-medium text-center ${done ? 'text-white' : 'text-gray-600'}`}>
                        {sCfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Timeline */}
            {logs.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-400" />
                  Activity Timeline
                </h3>
                <ol className="relative border-l border-gray-700 ml-3 space-y-6">
                  {logs.map((log, idx) => (
                    <li key={log._id || idx} className="ml-6">
                      <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary-900 border border-primary-500/50">
                        <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                      </span>
                      <div>
                        <p className="text-white font-medium text-sm">{log.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default TrackCase;
