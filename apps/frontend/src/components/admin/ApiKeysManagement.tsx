import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle, Calendar, Activity } from 'lucide-react';
import './AdminComponents.css';

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  userId: string;
  userName?: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
}

const ApiKeysManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchApiKeys();
        setShowCreateModal(false);
        setNewKeyName('');
        setNewKeyPermissions(['read']);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa API key này?')) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(key.length - 8)}`;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải danh sách API keys...</div>
      </div>
    );
  }

  return (
    <div className="apikeys-management">
      <div className="management-header">
        <div className="header-left">
          <Key size={24} />
          <div>
            <h2>Quản lý API Keys</h2>
            <p>{apiKeys.length} keys</p>
          </div>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Tạo API Key
        </button>
      </div>

      <div className="apikeys-grid">
        {apiKeys.map(apiKey => (
          <div key={apiKey._id} className={`apikey-card ${!apiKey.isActive ? 'inactive' : ''}`}>
            <div className="apikey-header">
              <div className="apikey-icon">
                <Key size={20} />
              </div>
              <div className="apikey-info">
                <h3>{apiKey.name}</h3>
                <p>{apiKey.userName || 'Unknown User'}</p>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDeleteKey(apiKey._id)}
                title="Xóa API key"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="apikey-body">
              <div className="key-display">
                <code>
                  {visibleKeys.has(apiKey._id) ? apiKey.key : maskKey(apiKey.key)}
                </code>
                <div className="key-actions">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey._id)}
                    title={visibleKeys.has(apiKey._id) ? 'Ẩn' : 'Hiện'}
                  >
                    {visibleKeys.has(apiKey._id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey._id)}
                    title="Copy"
                    className={copiedKey === apiKey._id ? 'copied' : ''}
                  >
                    {copiedKey === apiKey._id ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="permissions-list">
                {(apiKey.permissions || []).map(perm => (
                  <span key={perm} className="permission-badge">
                    {perm}
                  </span>
                ))}
              </div>

              <div className="apikey-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Tạo: {new Date(apiKey.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                {apiKey.lastUsed && (
                  <div className="meta-item">
                    <Activity size={14} />
                    <span>Dùng: {new Date(apiKey.lastUsed).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <div className="apikey-status">
                <span className={`status-indicator ${apiKey.isActive ? 'active' : 'inactive'}`}>
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="no-data-message">
          <Key size={48} />
          <p>Chưa có API key nào</p>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Tạo API Key đầu tiên
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo API Key mới</h3>
            <div className="form-group">
              <label>Tên API Key</label>
              <input
                type="text"
                placeholder="VD: Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Permissions</label>
              <div className="checkbox-group">
                {['read', 'write', 'delete', 'admin'].map(perm => (
                  <label key={perm} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyPermissions([...newKeyPermissions, perm]);
                        } else {
                          setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm));
                        }
                      }}
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button className="create-btn" onClick={handleCreateKey}>
                Tạo Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysManagement;
