const db = require('../db');

/**
 * Creates a new notification in the database.
 * @param {string} eventType - The type of the event (e.g., 'PROJECT_CREATED', 'ADMIN_LOGIN_SUCCESS').
 * @param {string} message - A human-readable message describing the notification.
 * @param {Object} [options] - Optional parameters.
 * @param {string} [options.projectId] - UUID of the related project, if any.
 * @param {number} [options.adminId] - ID of the related admin, if any.
 * @param {Object} [options.details] - Additional structured data (JSONB) related to the event.
 */
const createNotification = async (eventType, message, options = {}) => {
  const { projectId, adminId, details } = options;
  try {
    const query = `
      INSERT INTO notifications (event_type, message, project_id, admin_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [eventType, message, projectId, adminId, details ? JSON.stringify(details) : null];
    const result = await db.query(query, values);
    console.log(`Notification created: ${eventType} - ${message}`);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    // Depending on the importance, you might want to re-throw or handle differently
    // For now, we just log it to avoid breaking the main operation that triggered it.
  }
};

module.exports = {
  createNotification,
}; 