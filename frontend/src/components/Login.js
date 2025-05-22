// frontend/src/components/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle } from 'react-feather'; // For error message icon
import '../App.css'; // Assuming App.css has the login form styles
import logo from '../assets/logo.png'; // Import the logo

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, authError, setAuthError } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setAuthError) setAuthError(null); // Clear previous errors
    if (!username.trim() || !password.trim()) {
      if (setAuthError) setAuthError('Username and password are required.');
      return;
    }
    try {
      await login({ username, password });
      // Successful login is handled by AuthContext changing authToken,
      // which App.js observes to render the main application.
    } catch (error) {
      // login function in AuthContext should setAuthError.
      // If not, we can set it here: if (setAuthError) setAuthError(error.message || 'Login failed');
      console.error("Login attempt failed:", error); // Keep console log for debugging
    }
  };

  return (
    <div className="Login-page-container">
      <div className="Login-form-container">
        <img src={logo} alt="BangerTECH Logo" style={{ width: '100px', marginBottom: '20px' }} />
        <h1>Login</h1>
        {authError && (
          <p className="Error-message-login">
            <AlertTriangle size={18} style={{ marginRight: '8px' }} />
            {authError}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading}
              required
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 