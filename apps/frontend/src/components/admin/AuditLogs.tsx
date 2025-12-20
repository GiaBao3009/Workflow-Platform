import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, User, Activity } from 'lucide-react';
import './AdminComponents.css';

interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: any;
  timestamp: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failure'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterAction, filterStatus]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/admin/audit-logs?page=${currentPage}&action=${filterAction}&status=${filterStatus}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('create')) return 'success';
    if (action.includes('delete')) return 'danger';
    if (action.includes('update')) return 'warning';
    return 'info';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải audit logs...</div>
      </div>
    );
  }

  return (
    <div className="auditlogs-management">
      <div className="management-header">
        <div className="header-left">
          <FileText size={24} />
          <div>
            <h2>Audit Logs</h2>
            <p>{filteredLogs.length} logs</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo user, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      <div className="logs-timeline">
        {filteredLogs.map(log => (
          <div key={log._id} className={`log-item ${log.status}`}>
            <div className="log-indicator">
              <Activity size={16} />
            </div>
            <div className="log-content">
              <div className="log-header">
                <div className="log-action">
                  <span className={`action-badge ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="log-resource">{log.resource}</span>
                </div>
                <div className="log-time">
                  <Calendar size={14} />
                  <span>{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="log-details">
                <div className="log-user">
                  <User size={14} />
                  <span>{log.userName || 'Unknown User'}</span>
                </div>
                <div className="log-ip">
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>

              {log.details && (
                <div className="log-extra">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              )}

              <div className="log-status">
                <span className={`status-badge ${log.status}`}>
                  {log.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="no-data-message">
          <FileText size={48} />
          <p>Không tìm thấy log nào</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Trước
          </button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
