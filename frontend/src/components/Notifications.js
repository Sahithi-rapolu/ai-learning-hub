import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, ListGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Check for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/notifications/unread-count')
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      const updated = notifications.filter(n => n._id !== id);
      setNotifications(updated);
      // Update unread count if deleted notification was unread
      const deleted = notifications.find(n => n._id === id);
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }
    // Navigate to the course
    navigate(`/course/${notification.courseId._id || notification.courseId}`);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'video': '🎬',
      'notes': '📝',
      'quiz': '📝',
      'assignment': '📋',
      'resource': '📚'
    };
    return icons[type] || '📄';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="outline-light" id="notification-dropdown">
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '400px', maxHeight: '500px', overflow: 'auto' }}>
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Dropdown.Header>

        {loading ? (
          <div className="text-center p-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="m-2">
            {error}
          </Alert>
        ) : notifications.length === 0 ? (
          <div className="text-center p-4">
            <i className="bi bi-bell-slash" style={{ fontSize: '2rem', color: '#ccc' }}></i>
            <p className="mt-2 text-muted">No notifications</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item 
                key={notification._id}
                className={`d-flex justify-content-between align-items-start p-3 ${!notification.read ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-grow-1 me-2">
                  <div>
                    <span className="me-1">{getNotificationIcon(notification.moduleType)}</span>
                    <strong>{notification.moduleTitle}</strong>
                  </div>
                  <div className="text-muted small mt-1">
                    {notification.message.length > 80 
                      ? notification.message.substring(0, 80) + '...' 
                      : notification.message}
                  </div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-clock me-1"></i>
                    {getTimeAgo(notification.createdAt)}
                  </div>
                </div>
                <div className="d-flex flex-column align-items-end">
                  {!notification.read && (
                    <Badge bg="primary" pill className="mb-1">New</Badge>
                  )}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-danger p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {notifications.length > 0 && (
          <Dropdown.Item 
            className="text-center text-primary" 
            onClick={() => navigate('/notifications')}
          >
            View all notifications
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default Notifications;