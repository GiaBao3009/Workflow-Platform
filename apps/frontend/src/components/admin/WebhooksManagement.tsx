import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import './AdminComponents.css';

interface WebhookConfig {
  _id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

const WebhooksManagement: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });

  const availableEvents = [
    'workflow.started',
    'workflow.completed',
    'workflow.failed',
    'user.created',
    'user.deleted'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWebhook)
      });
      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
        setShowCreateModal(false);
        setNewWebhook({ name: '', url: '', events: [] });
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const handleToggleWebhook = async (webhookId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa webhook này?')) return;

    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải danh sách webhooks...</div>
      </div>
    );
  }

  return (
    <div className="webhooks-management">
      <div className="management-header">
        <div className="header-left">
          <Webhook size={24} />
          <div>
            <h2>Quản lý Webhooks</h2>
            <p>{webhooks.length} webhooks</p>
          </div>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Tạo Webhook
        </button>
      </div>

      <div className="webhooks-grid">
        {webhooks.map(webhook => (
          <div key={webhook._id} className={`webhook-card ${!webhook.isActive ? 'inactive' : ''}`}>
            <div className="webhook-header">
              <div className="webhook-icon">
                <Webhook size={20} />
              </div>
              <div className="webhook-info">
                <h3>{webhook.name}</h3>
                <code className="webhook-url">{webhook.url}</code>
              </div>
            </div>

            <div className="webhook-body">
              <div className="events-list">
                <label>Events:</label>
                <div className="events-badges">
                  {(webhook.events || []).map(event => (
                    <span key={event} className="event-badge">
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              <div className="webhook-stats">
                <div className="stat-item success">
                  <CheckCircle size={16} />
                  <span>{webhook.successCount || 0} thành công</span>
                </div>
                <div className="stat-item failure">
                  <XCircle size={16} />
                  <span>{webhook.failureCount || 0} thất bại</span>
                </div>
              </div>

              {webhook.lastTriggered && (
                <div className="webhook-meta">
                  <Clock size={14} />
                  <span>Trigger cuối: {new Date(webhook.lastTriggered).toLocaleString('vi-VN')}</span>
                </div>
              )}

              <div className="webhook-actions">
                <button
                  className={`toggle-btn ${webhook.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleWebhook(webhook._id, webhook.isActive)}
                >
                  {webhook.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteWebhook(webhook._id)}
                  title="Xóa webhook"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {webhooks.length === 0 && (
        <div className="no-data-message">
          <Webhook size={48} />
          <p>Chưa có webhook nào</p>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Tạo webhook đầu tiên
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo Webhook mới</h3>
            <div className="form-group">
              <label>Tên Webhook</label>
              <input
                type="text"
                placeholder="VD: Production Webhook"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Events</label>
              <div className="checkbox-group">
                {availableEvents.map(event => (
                  <label key={event} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                        } else {
                          setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                        }
                      }}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button className="create-btn" onClick={handleCreateWebhook}>
                Tạo Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksManagement;
