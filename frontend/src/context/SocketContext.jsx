import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';
import { SOCKET_URL } from '../api/axios';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const [socket, setSocket] = useState(null);

  // Depend on the user id (not the whole user object) so the socket is not
  // torn down and recreated every time the profile object changes.
  useEffect(() => {
    if (!userId) return undefined;

    // The server authenticates the socket with the same JWT used for REST calls
    const newSocket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });

    newSocket.on('global-notification', (data) => {
      toast(data.body, {
        icon: data.type === 'message' ? '💬' : '📁',
        style: { borderRadius: '10px', background: '#1f2937', color: '#fff', border: '1px solid #3b82f6' },
      });
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [userId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
