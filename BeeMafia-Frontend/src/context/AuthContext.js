import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [loading] = useState(false);

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

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('username');
    setUsername('');
  };

  const value = {
    user: username ? { username } : null,
    username,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
