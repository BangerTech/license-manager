const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth'); // Assuming this middleware exists

const router = express.Router();

// Middleware to protect all notification routes
router.use(authenticateToken);

// GET /api/notifications - Get all notifications for the logged-in admin (or all if super admin in future)
// For now, fetches all. Add admin_id filter if needed later based on req.user.userId
router.get('/', async (req, res) => {
  const { limit = 20, offset = 0, unreadOnly = 'false' } = req.query;
  try {
    let query = 'SELECT * FROM notifications';
    const queryParams = [];
    let paramIndex = 1;

    if (unreadOnly === 'true') {
      query += ' WHERE is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      queryParams.push(parseInt(limit, 10));
    }
    if (offset) {
      query += ` OFFSET $${paramIndex++}`;
      queryParams.push(parseInt(offset, 10));
    }

    const result = await db.query(query, queryParams);
    
    // Also get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM notifications';
    if (unreadOnly === 'true') {
        countQuery += ' WHERE is_read = FALSE';
    }
    const countResult = await db.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    res.json({ 
        notifications: result.rows,
        totalCount,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/:notificationId/read - Mark a specific notification as read
router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [notificationId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error marking notification ${notificationId} as read:`, err);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    // For now, marks ALL notifications as read. Later, this could be user-specific.
    await db.query('UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE is_read = FALSE');
    res.json({ message: 'All unread notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router; 