import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';
import './AdminComponents.css';

interface Notification {
  _id: string;
  userId: string;
  userName?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'warning': return <AlertCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notif.isRead) ||
                       (filterRead === 'unread' && !notif.isRead);
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-management">
      <div className="management-header">
        <div className="header-left">
          <Bell size={24} />
          <div>
            <h2>Quản lý Notifications</h2>
            <p>{filteredNotifications.length} notifications ({unreadCount} chưa đọc)</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            <Check size={18} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="filter-buttons">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tất cả loại</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <select value={filterRead} onChange={(e) => setFilterRead(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
        </div>
      </div>

      <div className="notifications-list">
        {filteredNotifications.map(notification => (
          <div
            key={notification._id}
            className={`notification-item ${notification.type} ${notification.isRead ? 'read' : 'unread'}`}
          >
            <div className={`notification-icon ${notification.type}`}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <div className="notification-header">
                <h4>{notification.title}</h4>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <p className="notification-message">{notification.message}</p>
              {notification.userName && (
                <span className="notification-user">
                  Từ: {notification.userName}
                </span>
              )}
            </div>
            <div className="notification-actions">
              {!notification.isRead && (
                <button
                  className="mark-read-btn"
                  onClick={() => handleMarkAsRead(notification._id)}
                  title="Đánh dấu đã đọc"
                >
                  <Check size={16} />
                </button>
              )}
              <button
                className="delete-btn"
                onClick={() => handleDeleteNotification(notification._id)}
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="no-data-message">
          <Bell size={48} />
          <p>Không có notification nào</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsManagement;
