import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, check if we have a token and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUsername = localStorage.getItem('username');

      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setUser(response.data.user);
          setUsername(response.data.user.username);
          setAuthToken(token);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('authToken');
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      } else if (storedUsername) {
        // Simple mode - just has username
        setUsername(storedUsername);
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Simple mode login (username only)
  const login = (newUsername) => {
    if (!newUsername || newUsername.trim().length < 3) {
      return {
        success: false,
        error: 'Username must be at least 3 characters'
      };
    }

    if (newUsername.length > 20) {
      return {
        success: false,
        error: 'Username must be less than 20 characters'
      };
    }

    const trimmedUsername = newUsername.trim();
    localStorage.setItem('username', trimmedUsername);
    setUsername(trimmedUsername);
    setIsAuthenticated(false);

    return { success: true };
  };

  // Authenticated signup
  const signup = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('username', userData.username);

      setAuthToken(token);
      setUser(userData);
      setUsername(userData.username);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed'
      };
    }
  };

  // Authenticated login
  const loginWithPassword = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('username', userData.username);

      setAuthToken(token);
      setUser(userData);
      setUsername(userData.username);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    setUsername('');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user: user || (username ? { username } : null),
    username,
    authToken,
    loading,
    isAuthenticated,
    login, // Simple mode
    signup, // Account creation
    loginWithPassword, // Authenticated login
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
