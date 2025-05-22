import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { changePassword, fetchAdmins } from '../services/api';
import { Shield, AlertTriangle, CheckCircle, Users, Settings as SettingsIcon } from 'react-feather';
import './SettingsPage.css'; // We will create this CSS file next

// Sub-component for the "Change My Password" tab
const ChangePasswordTab = () => {
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
  
  return (
    <div className="Settings-tab-content">
      <h3><Shield size={20} /> Change Your Password</h3>
      <p>Update your account password below. Choose a strong, unique password.</p>
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
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {message && (
          <div className="Message Message-success">
            <CheckCircle size={18} /> {message}
          </div>
        )}

        <button type="submit" className="Button Button-primary" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

// Sub-component for the "User Management" tab
const UserManagementTab = () => {
  const { user } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdmins = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchAdmins();
        setAdmins(data);
      } catch (err) {
        setError(err.message || 'Failed to load users.');
      }
      setIsLoading(false);
    };
    loadAdmins();
  }, []);

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <div className="Message Message-error"><AlertTriangle size={18} /> {error}</div>;

  return (
    <div className="Settings-tab-content">
      <h3><Users size={20} /> User Management</h3>
      {/* TODO: Add button to create new user here */} 
      {admins.length === 0 ? (
        <p>No administrator accounts found.</p>
      ) : (
        <table className="Admin-user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>{/* TODO */}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td>{admin.username}</td>
                <td>{admin.role}</td>
                <td>{/* TODO: Edit/Delete buttons */}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Sub-component for the "Notification Settings" tab (Placeholder)
const NotificationSettingsTab = () => {
  return (
    <div className="Settings-tab-content">
      <h3><SettingsIcon size={20} /> Notification Settings</h3>
      <p>Notification settings will be available here in a future update.</p>
      {/* TODO: Implement notification settings form */}
    </div>
  );
};

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('password'); // 'password', 'users', 'notifications'

  if (!user) {
    return <p>Loading user information...</p>; // Or redirect to login
  }

  const isAdmin = user && user.role === 'administrator';

  return (
    <div className="Settings-page-container Content-card">
      <h2>Settings</h2>
      <div className="Settings-tabs">
        <button 
          className={`Tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          My Password
        </button>
        {isAdmin && (
          <button 
            className={`Tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        )}
        <button 
          className={`Tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>

      {activeTab === 'password' && <ChangePasswordTab />}
      {isAdmin && activeTab === 'users' && <UserManagementTab />}
      {activeTab === 'notifications' && <NotificationSettingsTab />}

    </div>
  );
};

export default SettingsPage; 