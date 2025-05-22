import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../services/api';
import { Shield, AlertTriangle, CheckCircle } from 'react-feather';
import './SettingsPage.css'; // We will create this CSS file next

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setMessage(response.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p>Loading user information...</p>; // Or redirect to login
  }

  return (
    <div className="Settings-page-container Content-card">
      <h2><Shield size={24} style={{ marginRight: '10px', verticalAlign: 'bottom' }} />Change Password</h2>
      <p>Update your account password below. Choose a strong, unique password to keep your account secure.</p>
      
      <form onSubmit={handleSubmit} className="Settings-form">
        <div className="Form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input 
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="Form-group">
          <label htmlFor="newPassword">New Password</label>
          <input 
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>
        <div className="Form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input 
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="Message Message-error">
            <AlertTriangle size={18} style={{ marginRight: '8px' }} /> {error}
          </div>
        )}
        {message && (
          <div className="Message Message-success">
            <CheckCircle size={18} style={{ marginRight: '8px' }} /> {message}
          </div>
        )}

        <button type="submit" className="Button Button-primary" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage; 