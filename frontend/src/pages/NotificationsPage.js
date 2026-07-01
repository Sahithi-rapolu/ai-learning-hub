import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.get('/notifications');
      setNotifications(response.data);
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
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
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

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-bell me-2"></i>
          Notifications
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2">{unreadCount} unread</Badge>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button variant="outline-primary" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {notifications.length === 0 ? (
        <Card className="text-center p-5">
          <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <h5 className="mt-3">No notifications</h5>
          <p className="text-muted">You're all caught up!</p>
        </Card>
      ) : (
        <Card>
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item 
                key={notification._id}
                className={`d-flex justify-content-between align-items-start p-3 ${!notification.read ? 'bg-light border-start border-primary border-4' : ''}`}
              >
                <div 
                  className="flex-grow-1 me-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification._id);
                    navigate(`/course/${notification.courseId._id || notification.courseId}`);
                  }}
                >
                  <div>
                    <span className="me-2">{getNotificationIcon(notification.moduleType)}</span>
                    <strong>{notification.moduleTitle}</strong>
                    {!notification.read && (
                      <Badge bg="primary" className="ms-2">New</Badge>
                    )}
                  </div>
                  <div className="text-muted small mt-1">
                    {notification.message}
                  </div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-clock me-1"></i>
                    {getTimeAgo(notification.createdAt)}
                  </div>
                </div>
                <Button 
                  variant="link" 
                  className="text-danger p-0"
                  onClick={() => deleteNotification(notification._id)}
                >
                  <i className="bi bi-x-lg"></i>
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
    </div>
  );
}

export default NotificationsPage;