import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import UsernameEntry from './pages/UsernameEntry';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';

import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { username, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return username ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
              <Route path="/" element={<UsernameEntry />} />
              <Route
                path="/lobby"
                element={
                  <ProtectedRoute>
                    <LobbyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <GamePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
