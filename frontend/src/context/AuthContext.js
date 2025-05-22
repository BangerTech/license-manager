// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser as apiLoginUser } from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Small library to decode JWT

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const decodeToken = useCallback((token) => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired");
          return null;
        }
        return decoded;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (authToken) {
      const decodedUser = decodeToken(authToken);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, [authToken, decodeToken]);

  const login = async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await apiLoginUser(credentials);
      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        setAuthToken(data.token);
        setUser(data.user);
        return true;
      } else {
        setAuthError(data.message || 'Login failed: Token or user data missing in response.');
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ authToken, user, login, logout, loading, authError, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}; 