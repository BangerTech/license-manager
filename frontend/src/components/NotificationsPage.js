import React, { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { Bell, Eye, EyeOff, AlertCircle, CheckCircle } from 'react-feather';
import './NotificationsPage.css'; // We will create this CSS file next

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterUnread, setFilterUnread] = useState(false);
  const notificationsPerPage = 15;

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const offset = (currentPage - 1) * notificationsPerPage;
      const data = await fetchNotifications({
        limit: notificationsPerPage,
        offset: offset,
        unreadOnly: filterUnread
      });
      setNotifications(data.notifications || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
      setNotifications([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, notificationsPerPage, filterUnread]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Refresh or update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      // Optionally re-fetch if counts or other things need to be updated from server
      // loadNotifications(); 
    } catch (err) {
      setError(err.message || 'Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to mark all as read.');
    }
  };

  const totalPages = Math.ceil(totalCount / notificationsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterToggle = () => {
    setFilterUnread(prev => !prev);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="Notifications-page-container Content-card">
      <div className="Notifications-header">
        <h2><Bell size={24} style={{ marginRight: '10px', verticalAlign: 'bottom' }} />Notifications</h2>
        <div className="Notifications-actions">
            <button onClick={handleFilterToggle} className={`Button Button-secondary ${filterUnread ? 'active' : ''}`}>
                {filterUnread ? <EyeOff size={16} /> : <Eye size={16} />} {filterUnread ? 'Show All' : 'Unread Only'}
            </button>
            <button onClick={handleMarkAllRead} className="Button Button-secondary" disabled={isLoading || notifications.every(n => n.is_read)}>
                Mark All as Read
            </button>
        </div>
      </div>

      {isLoading && <p className="Loading-message">Loading notifications...</p>}
      {error && <p className="Message Message-error"><AlertCircle size={18} /> {error}</p>}
      
      {!isLoading && !error && notifications.length === 0 && (
        <p className="No-notifications-message">No notifications to display.</p>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <ul className="Notifications-list">
          {notifications.map(notification => (
            <li key={notification.id} className={`Notification-item ${notification.is_read ? 'read' : 'unread'}`}>
              <div className="Notification-icon">
                {notification.event_type && notification.event_type.includes('SUCCESS') ? <CheckCircle size={20} className="icon-success" /> : 
                 notification.event_type && notification.event_type.includes('FAILURE') ? <AlertCircle size={20} className="icon-error" /> : 
                 <Bell size={20} className="icon-default" />} 
              </div>
              <div className="Notification-content">
                <p className="Notification-message">{notification.message}</p>
                <span className="Notification-timestamp">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
                {notification.details && (
                  <pre className="Notification-details">{JSON.stringify(notification.details, null, 2)}</pre>
                )}
              </div>
              {!notification.is_read && (
                <button onClick={() => handleMarkAsRead(notification.id)} className="Button Button-icon Button-secondary">
                  <Eye size={16} title="Mark as read"/>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="Pagination-controls">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 