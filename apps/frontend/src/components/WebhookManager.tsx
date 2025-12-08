import { useState, useEffect } from 'react';
import { workflowApi } from '../services/api';
import './WebhookManager.css';

interface Webhook {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  hasSecret: boolean;
  isActive: boolean;
  webhookUrl: string;
  allowedIPs?: string[];
  rateLimitPerMinute: number;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdAt: string;
}

interface WebhookManagerProps {
  workflowId: string;
}

export default function WebhookManager({ workflowId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enableSignature, setEnableSignature] = useState(false);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [allowedIPs, setAllowedIPs] = useState('');

  // Newly created webhook (to show secret)
  const [newWebhook, setNewWebhook] = useState<any>(null);

  useEffect(() => {
    if (workflowId) {
      loadWebhooks();
    }
  }, [workflowId]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getWebhooks(workflowId);
      setWebhooks(data.webhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Webhook name is required');
      return;
    }

    try {
      setLoading(true);
      const data = await workflowApi.createWebhook(workflowId, {
        name: name.trim(),
        description: description.trim(),
        enableSignature,
        rateLimitPerMinute,
        allowedIPs: allowedIPs
          ? allowedIPs.split(',').map((ip) => ip.trim()).filter((ip) => ip)
          : [],
      });

      setNewWebhook(data.webhook);
      setShowForm(false);
      resetForm();
      loadWebhooks();
    } catch (error: any) {
      alert(`Failed to create webhook: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEnableSignature(false);
    setRateLimitPerMinute(60);
    setAllowedIPs('');
  };

  const handlePauseWebhook = async (webhookId: string) => {
    try {
      await workflowApi.pauseWebhook(webhookId);
      loadWebhooks();
    } catch (error: any) {
      alert(`Failed to pause webhook: ${error.message}`);
    }
  };

  const handleResumeWebhook = async (webhookId: string) => {
    try {
      await workflowApi.resumeWebhook(webhookId);
      loadWebhooks();
    } catch (error: any) {
      alert(`Failed to resume webhook: ${error.message}`);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Bạn có chắc muốn xóa webhook này?')) {
      return;
    }

    try {
      await workflowApi.deleteWebhook(webhookId);
      loadWebhooks();
    } catch (error: any) {
      alert(`Failed to delete webhook: ${error.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép vào clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="webhook-manager">
      <div className="webhook-header">
        <h3>🪝 Webhooks</h3>
        <button
          className="btn-create-webhook"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? '❌ Đóng' : '➕ Tạo Webhook'}
        </button>
      </div>

      {/* New Webhook Alert (show secret once) */}
      {newWebhook && (
        <div className="webhook-alert webhook-alert-success">
          <div className="alert-header">
            <strong>✅ Webhook đã được tạo thành công!</strong>
            <button onClick={() => setNewWebhook(null)}>✕</button>
          </div>
          <div className="alert-content">
            <div className="alert-item">
              <strong>Webhook URL:</strong>
              <div className="copy-field">
                <code>{newWebhook.webhookUrl}</code>
                <button onClick={() => copyToClipboard(newWebhook.webhookUrl)}>
                  📋 Sao chép
                </button>
              </div>
            </div>
            <div className="alert-item">
              <strong>API Key:</strong>
              <div className="copy-field">
                <code>{newWebhook.apiKey}</code>
                <button onClick={() => copyToClipboard(newWebhook.apiKey)}>
                  📋 Sao chép
                </button>
              </div>
            </div>
            {newWebhook.secret && (
              <div className="alert-item">
                <strong>Secret (dùng cho chữ ký HMAC):</strong>
                <div className="copy-field">
                  <code className="secret-code">{newWebhook.secret}</code>
                  <button onClick={() => copyToClipboard(newWebhook.secret)}>
                    📋 Sao chép
                  </button>
                </div>
                <p className="alert-warning">
                  ⚠️ Lưu secret này cẩn thận! Nó sẽ không được hiển thị lại.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Webhook Form */}
      {showForm && (
        <div className="webhook-form-container">
          <form onSubmit={handleCreateWebhook} className="webhook-form">
            <h4>📝 Tạo Webhook Mới</h4>

            <div className="form-group">
              <label htmlFor="webhook-name">Tên Webhook *</label>
              <input
                id="webhook-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Webhook GitHub Push, Webhook Thanh Toán Stripe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="webhook-description">Mô tả</label>
              <textarea
                id="webhook-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chức năng của webhook này..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableSignature}
                  onChange={(e) => setEnableSignature(e.target.checked)}
                />
                <span>🔒 Bật xác thực chữ ký HMAC (khuyến nghị)</span>
              </label>
              <small>
                Nếu bật, các request webhook phải có header X-Webhook-Signature
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="rate-limit">Giới hạn tốc độ (requests/phút)</label>
              <input
                id="rate-limit"
                type="number"
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
                min={1}
                max={1000}
              />
            </div>

            <div className="form-group">
              <label htmlFor="allowed-ips">Danh sách IP cho phép (phân cách bằng dấu phẩy, tùy chọn)</label>
              <input
                id="allowed-ips"
                type="text"
                value={allowedIPs}
                onChange={(e) => setAllowedIPs(e.target.value)}
                placeholder="VD: 192.168.1.1, 10.0.0.5"
              />
              <small>Để trống nếu cho phép tất cả IP</small>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} disabled={loading}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang tạo...' : '🚀 Tạo Webhook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhook List */}
      <div className="webhook-list">
        {loading && webhooks.length === 0 ? (
          <div className="loading">Đang tải webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="empty-state">
            <p>📭 Chưa có webhook nào</p>
            <p>Tạo webhook để trigger workflow này từ các dịch vụ bên ngoài</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="webhook-item">
              <div className="webhook-item-header">
                <div className="webhook-title">
                  <h4>{webhook.name}</h4>
                  {webhook.isActive ? (
                    <span className="badge badge-active">🟢 Đang hoạt động</span>
                  ) : (
                    <span className="badge badge-paused">⏸️ Đã tạm dừng</span>
                  )}
                  {webhook.hasSecret && (
                    <span className="badge badge-secure">🔒 Có chữ ký</span>
                  )}
                </div>
                <div className="webhook-actions">
                  {webhook.isActive ? (
                    <button
                      className="btn-pause"
                      onClick={() => handlePauseWebhook(webhook.id)}
                      title="Tạm dừng webhook"
                    >
                      ⏸️ Tạm dừng
                    </button>
                  ) : (
                    <button
                      className="btn-resume"
                      onClick={() => handleResumeWebhook(webhook.id)}
                      title="Tiếp tục webhook"
                    >
                      ▶️ Tiếp tục
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    title="Xóa webhook"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {webhook.description && (
                <p className="webhook-description">{webhook.description}</p>
              )}

              <div className="webhook-details">
                <div className="detail-row">
                  <strong>URL:</strong>
                  <div className="copy-field">
                    <code className="webhook-url">{webhook.webhookUrl}</code>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(webhook.webhookUrl)}
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="detail-row">
                  <strong>Giới hạn tốc độ:</strong>
                  <span>{webhook.rateLimitPerMinute} requests/phút</span>
                </div>

                {webhook.allowedIPs && webhook.allowedIPs.length > 0 && (
                  <div className="detail-row">
                    <strong>IP cho phép:</strong>
                    <span>{webhook.allowedIPs.join(', ')}</span>
                  </div>
                )}

                <div className="detail-row">
                  <strong>Đã trigger:</strong>
                  <span>
                    {webhook.triggerCount} lần
                    {webhook.lastTriggeredAt &&
                      ` (lần cuối: ${formatDate(webhook.lastTriggeredAt)})`}
                  </span>
                </div>

                <div className="detail-row">
                  <strong>Ngày tạo:</strong>
                  <span>{formatDate(webhook.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
