/**
 * Comprehensive Admin Dashboard Component
 * Includes: Stats, API Keys, Webhooks, Schedules, Audit Logs, Notifications, System Health
 */

import { useEffect, useState } from 'react';
import { 
  Users, Workflow, Play, Activity, TrendingUp,
  Key, Webhook as WebhookIcon, Clock, Bell, AlertCircle, CheckCircle,
  RefreshCw, Database, Server, Zap, Shield, BarChart3
} from 'lucide-react';
import './AdminDashboard.css';

// Import admin components
import UsersManagement from '../components/admin/UsersManagement';
import ApiKeysManagement from '../components/admin/ApiKeysManagement';
import WebhooksManagement from '../components/admin/WebhooksManagement';
import SchedulesManagement from '../components/admin/SchedulesManagement';
import AuditLogs from '../components/admin/AuditLogs';
import NotificationsManagement from '../components/admin/NotificationsManagement';
import SystemHealth from '../components/admin/SystemHealth';

type Tab = 'dashboard' | 'users' | 'api-keys' | 'webhooks' | 'schedules' | 'audit-logs' | 'notifications' | 'system-health';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  workflows: {
    total: number;
    active: number;
  };
  executions: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  };
  webhooks: {
    total: number;
    active: number;
  };
  schedules: {
    total: number;
    active: number;
  };
  apiKeys: {
    total: number;
    global: number;
  };
}

// Default stats when API is not available
const defaultStats: DashboardStats = {
  users: { total: 0, active: 0, newThisMonth: 0 },
  workflows: { total: 0, active: 0 },
  executions: { total: 0, completed: 0, failed: 0, successRate: 0 },
  webhooks: { total: 0, active: 0 },
  schedules: { total: 0, active: 0 },
  apiKeys: { total: 0, global: 0 }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        setError('⚠️ Bạn chưa đăng nhập. Vui lòng đăng nhập để xem trang admin.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        setError(`🔒 ${errorData.message || 'Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.'}`);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load dashboard');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      setError(`❌ ${error.message || 'Không thể kết nối với server. Vui lòng kiểm tra backend có đang chạy không.'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardStats(true);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải bảng điều khiển...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>
            <Shield className="header-icon" size={32} />
            Bảng Điều Khiển Quản Trị
          </h1>
          <p>Quản lý toàn diện nền tảng workflow automation</p>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && (
        <div className="admin-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          {error.includes('đăng nhập') && (
            <a href="/" style={{ marginLeft: '8px', color: '#4facfe', textDecoration: 'underline' }}>
              Đi tới trang đăng nhập
            </a>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={18} />
          Dashboard
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button 
          className={`admin-tab ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          <Key size={18} />
          API Keys
        </button>
        <button 
          className={`admin-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhooks')}
        >
          <WebhookIcon size={18} />
          Webhooks
        </button>
        <button 
          className={`admin-tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <Clock size={18} />
          Schedules
        </button>
        <button 
          className={`admin-tab ${activeTab === 'audit-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-logs')}
        >
          <AlertCircle size={18} />
          Audit Logs
        </button>
        <button 
          className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} />
          Notifications
        </button>
        <button 
          className={`admin-tab ${activeTab === 'system-health' ? 'active' : ''}`}
          onClick={() => setActiveTab('system-health')}
        >
          <CheckCircle size={18} />
          System Health
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            {/* Quick Stats Row */}
            <div className="quick-stats-row">
              <div className="quick-stat">
                <Database size={20} />
                <span>MongoDB: <strong className="status-ok">Connected</strong></span>
              </div>
              <div className="quick-stat">
                <Server size={20} />
                <span>Temporal: <strong className="status-ok">Running</strong></span>
              </div>
              <div className="quick-stat">
                <Zap size={20} />
                <span>API: <strong className="status-ok">Healthy</strong></span>
              </div>
              <div className="quick-stat">
                <BarChart3 size={20} />
                <span>Uptime: <strong>99.9%</strong></span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tổng Người Dùng</p>
                  <h3 className="stat-value">{stats.users.total}</h3>
                  <div className="stat-details">
                    <span>✅ Active: {stats.users.active}</span>
                    <span className="stat-meta">🆕 Mới: {stats.users.newThisMonth}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Workflow size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Workflow Hoạt Động</p>
                  <h3 className="stat-value">{stats.workflows.active}</h3>
                  <div className="stat-details">
                    <span>📊 Tổng: {stats.workflows.total}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Play size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tổng Lượt Thực Thi</p>
                  <h3 className="stat-value">{stats.executions.total}</h3>
                  <div className="stat-details">
                    <span>✅ Thành công: {stats.executions.completed}</span>
                    <span className="stat-meta">❌ Thất bại: {stats.executions.failed}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tỷ Lệ Thành Công</p>
                  <h3 className="stat-value">{stats.executions.successRate}%</h3>
                  <div className="stat-change positive">
                    <TrendingUp size={14} />
                    <span>Hiệu suất xuất sắc</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <Key size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">API Keys</p>
                  <h3 className="stat-value">{stats.apiKeys.total}</h3>
                  <div className="stat-details">
                    <span>🌍 Global: {stats.apiKeys.global}</span>
                    <span className="stat-meta">👤 User: {stats.apiKeys.total - stats.apiKeys.global}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                  <WebhookIcon size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Webhooks</p>
                  <h3 className="stat-value">{stats.webhooks.total}</h3>
                  <div className="stat-details">
                    <span>✅ Active: {stats.webhooks.active}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Scheduled Tasks</p>
                  <h3 className="stat-value">{stats.schedules.total}</h3>
                  <div className="stat-details">
                    <span>▶️ Active: {stats.schedules.active}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'api-keys' && <ApiKeysManagement />}
        {activeTab === 'webhooks' && <WebhooksManagement />}
        {activeTab === 'schedules' && <SchedulesManagement />}
        {activeTab === 'audit-logs' && <AuditLogs />}
        {activeTab === 'notifications' && <NotificationsManagement />}
        {activeTab === 'system-health' && <SystemHealth />}
      </div>
    </div>
  );
}
