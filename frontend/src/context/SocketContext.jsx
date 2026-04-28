import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      const socketUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
      const newSocket = io(socketUrl);
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join', user._id);
      });

      newSocket.on('global-notification', (data) => {
        toast(data.body, {
          icon: data.type === 'message' ? '💬' : '📁',
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #3b82f6',
          },
        });
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
