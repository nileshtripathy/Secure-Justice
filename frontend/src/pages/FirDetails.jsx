import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { Shield, FileText, Clock, CheckCircle, Upload, ArrowLeft, ShieldAlert, Printer, Copy, Hash, MessageSquare, Send, Gavel, EyeOff } from 'lucide-react';

const FirDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socket = useSocket();
  
  const [fir, setFir] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [newStatus, setNewStatus] = useState('');
  const [statusError, setStatusError] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  const [verificationResult, setVerificationResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);
  
  // Messaging
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Judgment
  const [judgmentText, setJudgmentText] = useState('');

  const copyCase = () => {
    const num = fir?.caseNumber;
    if (num) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchData = async () => {
    try {
      // Use allSettled so a failure in messages/logs won't prevent FIR from loading
      const [firResult, evidenceResult, logResult, msgResult] = await Promise.allSettled([
        api.get(`/fir/${id}`),
        api.get(`/evidence/fir/${id}`),
        api.get(`/caselogs/${id}`),
        api.get(`/messages/fir/${id}`),
      ]);

      if (firResult.status === 'fulfilled') {
        setFir(firResult.value.data);
        setNewStatus(firResult.value.data.status);
        setJudgmentText(firResult.value.data.judgment || '');
      } else {
        console.error('FIR fetch failed:', firResult.reason);
      }

      if (evidenceResult.status === 'fulfilled') {
        setEvidence(evidenceResult.value.data);
      }

      if (logResult.status === 'fulfilled') {
        setLogs(logResult.value.data);
      }

      if (msgResult.status === 'fulfilled') {
        setMessages(msgResult.value.data);
      }

    } catch (error) {
      console.error('Unexpected error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join-fir', id);

      const handleNewMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
      };

      const handleNewEvidence = (ev) => {
        setEvidence((prev) => [...prev, ev]);
      };

      socket.on('new-message', handleNewMessage);
      socket.on('new-evidence', handleNewEvidence);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('new-evidence', handleNewEvidence);
      };
    }
  }, [socket, id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploadError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('firId', id);
    formData.append('description', description);

    try {
      await api.post('/evidence/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      setDescription('');
      fetchData();
    } catch (err) {
      setUploadError(err?.response?.data?.message || 'Failed to upload evidence.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async () => {
    setStatusError('');
    try {
      await api.put(`/fir/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      setStatusError(err?.response?.data?.message || 'Failed to update status.');
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      const res = await api.post(`/messages/fir/${id}`, { content: msgText });
      setMessages(prev => [...prev, res.data]);
      setMsgText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSubmitJudgment = async () => {
    if (!judgmentText.trim()) return;
    try {
      await api.put(`/fir/${id}`, { judgment: judgmentText, status: 'closed' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (evidenceId) => {
    try {
      const res = await api.get(`/evidence/verify/${evidenceId}`);
      setVerificationResult({
        success: true,
        message: res.data.message,
        hash: res.data.originalHash
      });
    } catch (err) {
      console.error(err);
      setVerificationResult({
        success: false,
        message: "Verification failed. Could not confirm evidence integrity.",
        hash: null
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading case details...</p>
      </div>
    </div>
  );

  if (!fir) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="glass-panel p-10 rounded-2xl">
        <ShieldAlert className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Case Not Found</h2>
        <p className="text-gray-400 mb-6">
          This FIR could not be loaded. It may have been removed, or you may not have permission to view it.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-gray-700">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <button onClick={() => { setLoading(true); fetchData(); }} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700">
          <Printer className="h-4 w-4" />
          Print / Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-primary-900/50 text-primary-400 px-3 py-1 rounded text-sm font-semibold border border-primary-500/20 mb-3 inline-block">
                  {fir.crimeType}
                </span>
                <h1 className="text-2xl font-bold text-white mb-1">Complaint Details</h1>
                <p className="text-gray-400 text-sm">Filed on {new Date(fir.date).toLocaleDateString()} at {new Date(fir.date).toLocaleTimeString()}</p>
              </div>
              <div className="text-right space-y-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  fir.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30' :
                  fir.status === 'verified' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/30' :
                  fir.status === 'investigating' ? 'bg-purple-900/30 text-purple-500 border border-purple-500/30' :
                  'bg-green-900/30 text-green-500 border border-green-500/30'
                }`}>
                  {fir.status === 'pending' ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4"/>}
                  <span className="capitalize">{fir.status}</span>
                </div>
              </div>
            </div>

            {/* Case Number Banner */}
            {fir.caseNumber && (
              <div className="flex items-center justify-between bg-gray-800/60 border border-gray-600/50 rounded-xl px-5 py-3 mb-6">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-500 leading-none mb-0.5">Case Reference Number</p>
                    <p className="text-white font-mono font-bold text-xl tracking-widest">{fir.caseNumber}</p>
                  </div>
                </div>
                <button
                  onClick={copyCase}
                  className="flex items-center gap-2 bg-primary-700/30 hover:bg-primary-700/50 text-primary-300 border border-primary-500/30 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 mb-6">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{fir.complaintText}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Location</span>
                <span className="text-white font-medium">{fir.location}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Complainant</span>
                <span className="text-white font-medium">
                  {fir.isAnonymous ? (
                    <span className="flex items-center gap-1 text-gray-400"><EyeOff className="h-4 w-4" /> Anonymous</span>
                  ) : (fir.userId?.name || 'Unknown')}
                </span>
              </div>
            </div>
            {fir.isAnonymous && (
              <div className="mt-4 flex items-center gap-2 text-xs bg-gray-800/50 border border-gray-700/50 text-gray-400 px-3 py-2 rounded-lg">
                <EyeOff className="h-3.5 w-3.5" /> This complaint was filed anonymously. Complainant identity is protected.
              </div>
            )}
          </div>

          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary-400" />
              Digital Evidence
            </h2>

            {evidence.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No evidence uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {evidence.map(ev => (
                  <div key={ev._id} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="overflow-hidden">
                      <p className="text-white font-medium mb-1">{ev.description || 'Uploaded File'}</p>
                      <p className="text-xs text-gray-500 font-mono truncate w-full max-w-xs sm:max-w-md">Hash: {ev.fileHash}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <a href={`http://localhost:5000${ev.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition-colors">
                        View File
                      </a>
                      {['forensic', 'judge', 'police', 'admin'].includes(user?.role) && (
                        <button onClick={() => handleVerify(ev._id)} className="text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded transition-colors">
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          {logs.length > 0 && (
            <div className="glass-panel p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary-400" />
                Case Audit Trail
              </h2>
              <ol className="relative border-l border-gray-700 ml-3 space-y-6">
                {logs.map((log, idx) => (
                  <li key={log._id || idx} className="ml-6">
                    <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary-900 border border-primary-500/50">
                      <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">{log.action}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="text-gray-400">{log.performedBy?.name}</span>
                        <span className="text-gray-600 capitalize">({log.performedBy?.role})</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="space-y-6 print:hidden">
          {user?.role !== 'citizen' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Update Status</h3>
              <select 
                value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="investigating">Investigating</option>
                <option value="forensic_review">Forensic Review</option>
                <option value="legal_review">Legal Review</option>
                <option value="closed">Closed</option>
              </select>
              {statusError && <div className="text-red-400 text-sm mb-3 text-center">{statusError}</div>}
              <button 
                onClick={handleStatusUpdate}
                disabled={newStatus === fir.status}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
              >
                Update Status
              </button>
            </div>
          )}

          {['police', 'forensic', 'admin'].includes(user?.role) && fir.status !== 'closed' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary-400" />
                Upload Evidence
              </h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <input 
                    type="text" required value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="E.g., CCTV Footage, Fingerprint scan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">File</label>
                  <input 
                    type="file" required onChange={e => setFile(e.target.files[0])}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
                  />
                </div>
                {uploadError && <div className="text-red-400 text-sm mb-2 text-center">{uploadError}</div>}
                <button 
                  type="submit" disabled={uploading || !file}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors mt-2"
                >
                  {uploading ? 'Uploading...' : 'Upload Securely'}
                </button>
              </form>
            </div>
          )}

          {/* Secure Messaging */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-400" />
              Secure Case Messaging
            </h3>
            <div className="bg-gray-900/50 rounded-xl p-3 mb-3 h-48 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">No messages yet. Start a secure conversation.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg._id} className={`flex gap-2 ${msg.sender?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary-900 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">
                      {(msg.sender?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] ${msg.sender?._id === user?._id ? 'bg-primary-900/50 border border-primary-500/20' : 'bg-gray-800/60 border border-gray-700/40'}`}>
                      <p className="text-white text-sm">{msg.content}</p>
                      <p className="text-gray-600 text-xs mt-0.5 capitalize">{msg.sender?.name} · {msg.sender?.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Type a secure message..."
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !msgText.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Judgment Panel - Judges only */}
          {user?.role === 'judge' && (
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-900/10">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-amber-400" />
                Final Judgment
              </h3>
              {fir.judgment ? (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
                  <p className="text-sm text-gray-400 mb-1">Judgment recorded on {fir.judgmentDate ? new Date(fir.judgmentDate).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-white text-sm leading-relaxed">{fir.judgment}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={judgmentText}
                    onChange={e => setJudgmentText(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter the final court judgment..."
                  />
                  <button
                    onClick={handleSubmitJudgment}
                    disabled={!judgmentText.trim()}
                    className="w-full bg-amber-600/80 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Submit & Close Case
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show judgment to everyone if it exists */}
          {fir.judgment && user?.role !== 'judge' && (
            <div className="glass-panel p-6 rounded-2xl border border-green-500/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-green-400" /> Court Judgment
              </h3>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
                <p className="text-sm text-gray-400 mb-1">Recorded on {fir.judgmentDate ? new Date(fir.judgmentDate).toLocaleDateString() : 'N/A'}</p>
                <p className="text-white text-sm leading-relaxed">{fir.judgment}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {verificationResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative">
            <button 
              onClick={() => setVerificationResult(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center mb-6">
              {verificationResult.success ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <div className="h-16 w-16 text-red-500 mx-auto mb-4 flex items-center justify-center">
                  <ShieldAlert className="h-12 w-12" />
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">
                {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
              </h3>
              <p className="text-gray-400">{verificationResult.message}</p>
            </div>
            
            {verificationResult.hash && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <p className="text-sm text-gray-500 mb-1">SHA256 Checksum (Original)</p>
                <p className="text-sm text-white font-mono break-all">{verificationResult.hash}</p>
              </div>
            )}
            
            <button 
              onClick={() => setVerificationResult(null)}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirDetails;
