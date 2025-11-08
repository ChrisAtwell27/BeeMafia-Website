import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { username } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (username) {
      const newSocket = io(SOCKET_URL, {
        auth: { username }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Connection error');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        toast.error('Failed to connect to server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [username]);

  const value = {
    socket,
    connected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
