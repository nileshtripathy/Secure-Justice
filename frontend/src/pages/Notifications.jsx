import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Bell, CheckCheck, Info, AlertCircle, Upload, MessageSquare, Gavel, FileText } from 'lucide-react';

const typeConfig = {
  status_change: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-500/20' },
  evidence:      { icon: Upload,       color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-500/20'   },
  message:       { icon: MessageSquare,color: 'text-primary-400',bg: 'bg-primary-900/30 border-primary-500/20' },
  assignment:    { icon: FileText,     color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-500/20'},
  judgment:      { icon: Gavel,        color: 'text-green-400',  bg: 'bg-green-900/30 border-green-500/20' },
};

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) await markRead(notif._id);
    if (notif.firId?._id) navigate(`/fir/${notif.firId._id}`);
  };

  const unread = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary-400" />
            Notifications
            {unread > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unread}</span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Stay updated on your case activity</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No notifications yet. They will appear here when your cases are updated.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.status_change;
            const Icon = cfg.icon;
            return (
              <button
                key={notif._id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                  notif.isRead
                    ? 'glass-panel opacity-60 hover:opacity-90'
                    : `${cfg.bg} border glass-panel`
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${notif.isRead ? 'bg-gray-800' : cfg.bg}`}>
                  <Icon className={`h-5 w-5 ${notif.isRead ? 'text-gray-500' : cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`font-semibold text-sm ${notif.isRead ? 'text-gray-300' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-primary-400 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {notif.firId?.caseNumber && (
                      <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{notif.firId.caseNumber}</span>
                    )}
                    <span className="text-xs text-gray-600">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
