import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Play, Pause, Repeat } from 'lucide-react';
import './AdminComponents.css';

interface Schedule {
  _id: string;
  name: string;
  workflowId: string;
  workflowName?: string;
  cronExpression: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  createdAt: string;
}

const SchedulesManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa schedule này?')) return;

    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const parseCronExpression = (cron: string): string => {
    const parts = cron.split(' ');
    if (parts.length < 5) return cron;

    const [minute, hour] = parts;
    
    if (minute === '*' && hour === '*') return 'Mỗi phút';
    if (minute !== '*' && hour === '*') return `Mỗi giờ vào phút ${minute}`;
    if (minute !== '*' && hour !== '*') return `Hàng ngày lúc ${hour}:${minute}`;
    
    return cron;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải danh sách schedules...</div>
      </div>
    );
  }

  return (
    <div className="schedules-management">
      <div className="management-header">
        <div className="header-left">
          <Clock size={24} />
          <div>
            <h2>Quản lý Schedules</h2>
            <p>{schedules.length} schedules</p>
          </div>
        </div>
      </div>

      <div className="schedules-grid">
        {schedules.map(schedule => (
          <div key={schedule._id} className={`schedule-card ${!schedule.isActive ? 'inactive' : ''}`}>
            <div className="schedule-header">
              <div className="schedule-icon">
                <Clock size={20} />
              </div>
              <div className="schedule-info">
                <h3>{schedule.name}</h3>
                <p>{schedule.workflowName || 'Unknown Workflow'}</p>
              </div>
            </div>

            <div className="schedule-body">
              <div className="cron-display">
                <Repeat size={16} />
                <div>
                  <strong>{parseCronExpression(schedule.cronExpression)}</strong>
                  <code>{schedule.cronExpression}</code>
                </div>
              </div>

              <div className="schedule-times">
                {schedule.lastRun && (
                  <div className="time-item">
                    <span className="time-label">Chạy cuối:</span>
                    <span>{new Date(schedule.lastRun).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {schedule.nextRun && (
                  <div className="time-item">
                    <span className="time-label">Chạy tiếp:</span>
                    <span>{new Date(schedule.nextRun).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <div className="schedule-stats">
                <div className="stat-badge">
                  <Play size={14} />
                  <span>{schedule.runCount} lần chạy</span>
                </div>
              </div>

              <div className="schedule-actions">
                <button
                  className={`toggle-btn ${schedule.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleSchedule(schedule._id, schedule.isActive)}
                >
                  {schedule.isActive ? <Pause size={16} /> : <Play size={16} />}
                  {schedule.isActive ? 'Active' : 'Paused'}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteSchedule(schedule._id)}
                  title="Xóa schedule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="no-data-message">
          <Clock size={48} />
          <p>Chưa có schedule nào</p>
        </div>
      )}
    </div>
  );
};

export default SchedulesManagement;
