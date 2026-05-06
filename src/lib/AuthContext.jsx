import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setAuthError({ type: 'auth_required', message });
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setAuthError({ type: 'auth_required', message });
      return { success: false, message };
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    // For local version, we'll just set auth error to show login
    setAuthError({ type: 'auth_required', message: 'Please login to continue' });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      register,
      logout,
      navigateToLogin,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
