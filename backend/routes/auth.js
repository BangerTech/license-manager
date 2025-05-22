const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Assuming db/index.js exports query or specific functions
const { authenticateToken } = require('../middleware/auth'); // Assuming this middleware exists
const { createNotification } = require('../services/notificationService'); // Import notification service

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Find admin by username
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      await createNotification('ADMIN_LOGIN_FAILURE', `Login attempt failed for username: ${username}. Reason: User not found.`, { details: { username, ipAddress: req.ip } });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      await createNotification('ADMIN_LOGIN_FAILURE', `Login attempt failed for username: ${admin.username} (ID: ${admin.id}). Reason: Incorrect password.`, { adminId: admin.id, details: { username: admin.username, ipAddress: req.ip } });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // User authenticated, create JWT
    const accessToken = jwt.sign(
      { userId: admin.id, username: admin.username, role: admin.role, profile_image_url: admin.profile_image_url },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour, adjust as needed
    );

    await createNotification('ADMIN_LOGIN_SUCCESS', `Admin ${admin.username} (ID: ${admin.id}) logged in successfully.`, { adminId: admin.id, details: { ipAddress: req.ip } });

    res.json({ 
      token: accessToken,
      user: { id: admin.id, username: admin.username, role: admin.role, profile_image_url: admin.profile_image_url }
    });

  } catch (err) {
    console.error('Login error:', err);
    // Log generic login failure as well, if specific user context is not available
    await createNotification('ADMIN_LOGIN_ERROR', `Server error during login attempt for username: ${username}.`, { details: { error: err.message, username, ipAddress: req.ip } });
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.userId; // Get userId from JWT payload (set by authenticateToken)
  const username = req.user.username;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required: current password, new password, and confirm password.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match.' });
  }

  if (newPassword.length < 6) { // Basic length validation, adjust as needed
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    // Fetch admin from DB
    const result = await db.query('SELECT * FROM admins WHERE id = $1', [userId]);
    const admin = result.rows[0];

    if (!admin) {
      // This should not happen if token is valid and user exists, but as a safeguard
      return res.status(404).json({ message: 'Admin user not found.' }); 
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      await createNotification('ADMIN_PASSWORD_CHANGE_FAILURE', `Password change attempt failed for ${username} (ID: ${userId}). Reason: Incorrect current password.`, { adminId: userId, details: { ipAddress: req.ip } });
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password in DB
    await db.query(
      'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    await createNotification('ADMIN_PASSWORD_CHANGE_SUCCESS', `Password changed successfully for ${username} (ID: ${userId}).`, { adminId: userId, details: { ipAddress: req.ip } });

    res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err);
    await createNotification('ADMIN_PASSWORD_CHANGE_ERROR', `Server error during password change for ${username} (ID: ${userId}).`, { adminId: userId, details: { error: err.message, ipAddress: req.ip } });
    res.status(500).json({ message: 'Server error during password change.' });
  }
});

module.exports = router; 