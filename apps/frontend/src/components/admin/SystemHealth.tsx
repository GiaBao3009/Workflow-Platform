import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Cpu, HardDrive, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './AdminComponents.css';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  details?: string;
}

interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'critical';
  uptime: string;
  cpu: HealthMetric;
  memory: HealthMetric;
  disk: HealthMetric;
  database: HealthMetric;
  api: HealthMetric;
  worker: HealthMetric;
  lastCheck: string;
}

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/system-health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={20} className="status-icon healthy" />;
      case 'warning': return <AlertTriangle size={20} className="status-icon warning" />;
      case 'critical': return <AlertTriangle size={20} className="status-icon critical" />;
      default: return <Activity size={20} />;
    }
  };



  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang kiểm tra system health...</div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="no-data-message">
        <Activity size={48} />
        <p>Không thể tải system health</p>
      </div>
    );
  }

  return (
    <div className="systemhealth-management">
      <div className="management-header">
        <div className="header-left">
          <Activity size={24} />
          <div>
            <h2>System Health</h2>
            <p>Kiểm tra cuối: {new Date(health.lastCheck).toLocaleString('vi-VN')}</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (30s)
          </label>
          <button className="refresh-btn" onClick={fetchHealth}>
            <Activity size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overall-status">
        <div className={`status-card ${health.overall}`}>
          {getStatusIcon(health.overall)}
          <div>
            <h3>Overall Status</h3>
            <p className="status-text">{health.overall.toUpperCase()}</p>
          </div>
        </div>
        <div className="uptime-card">
          <Zap size={24} />
          <div>
            <h3>System Uptime</h3>
            <p className="uptime-text">{health.uptime}</p>
          </div>
        </div>
      </div>

      <div className="health-metrics-grid">
        <div className={`health-metric ${health.cpu.status}`}>
          <div className="metric-header">
            <Cpu size={24} />
            <h3>CPU</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.cpu.value}</div>
            {health.cpu.details && <p className="metric-details">{health.cpu.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.cpu.status)}
              <span>{health.cpu.status}</span>
            </div>
          </div>
        </div>

        <div className={`health-metric ${health.memory.status}`}>
          <div className="metric-header">
            <Server size={24} />
            <h3>Memory</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.memory.value}</div>
            {health.memory.details && <p className="metric-details">{health.memory.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.memory.status)}
              <span>{health.memory.status}</span>
            </div>
          </div>
        </div>

        <div className={`health-metric ${health.disk.status}`}>
          <div className="metric-header">
            <HardDrive size={24} />
            <h3>Disk</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.disk.value}</div>
            {health.disk.details && <p className="metric-details">{health.disk.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.disk.status)}
              <span>{health.disk.status}</span>
            </div>
          </div>
        </div>

        <div className={`health-metric ${health.database.status}`}>
          <div className="metric-header">
            <Database size={24} />
            <h3>Database</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.database.value}</div>
            {health.database.details && <p className="metric-details">{health.database.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.database.status)}
              <span>{health.database.status}</span>
            </div>
          </div>
        </div>

        <div className={`health-metric ${health.api.status}`}>
          <div className="metric-header">
            <Activity size={24} />
            <h3>API Server</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.api.value}</div>
            {health.api.details && <p className="metric-details">{health.api.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.api.status)}
              <span>{health.api.status}</span>
            </div>
          </div>
        </div>

        <div className={`health-metric ${health.worker.status}`}>
          <div className="metric-header">
            <Zap size={24} />
            <h3>Worker</h3>
          </div>
          <div className="metric-body">
            <div className="metric-value">{health.worker.value}</div>
            {health.worker.details && <p className="metric-details">{health.worker.details}</p>}
            <div className="metric-status">
              {getStatusIcon(health.worker.status)}
              <span>{health.worker.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
