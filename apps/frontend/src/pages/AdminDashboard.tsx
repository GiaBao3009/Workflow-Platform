import { useEffect, useState } from 'react';
import { Users, Workflow, Play, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  userGrowth: number;
  workflowGrowth: number;
  executionGrowth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
      // Fallback: Load từ database trực tiếp
      loadStatsFromDB();
    } finally {
      setLoading(false);
    }
  };

  const loadStatsFromDB = async () => {
    try {
      // Lấy users
      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();
      
      // Lấy workflows
      const workflowsRes = await fetch('/api/workflows');
      const workflows = await workflowsRes.json();
      
      // Lấy executions
      const executionsRes = await fetch('/api/executions');
      const executions = await executionsRes.json();

      const completedExecutions = executions.filter((e: any) => e.status === 'completed').length;
      
      setStats({
        totalUsers: users.length || 0,
        activeUsers: users.filter((u: any) => u.isActive).length || 0,
        totalWorkflows: workflows.length || 0,
        activeWorkflows: workflows.filter((w: any) => w.status === 'active').length || 0,
        totalExecutions: executions.length || 0,
        successRate: executions.length > 0 ? Math.round((completedExecutions / executions.length) * 100) : 0,
        userGrowth: 0,
        workflowGrowth: 0,
        executionGrowth: 0,
      });
    } catch (error) {
      console.error('Lỗi tải từ database:', error);
    }
  };

  const executionData = [
    { name: 'T2', thanhCong: 120, thatBai: 8 },
    { name: 'T3', thanhCong: 145, thatBai: 12 },
    { name: 'T4', thanhCong: 132, thatBai: 6 },
    { name: 'T5', thanhCong: 168, thatBai: 15 },
    { name: 'T6', thanhCong: 190, thatBai: 10 },
    { name: 'T7', thanhCong: 95, thatBai: 4 },
    { name: 'CN', thanhCong: 78, thatBai: 3 },
  ];

  const userActivityData = [
    { gio: '00:00', nguoiDung: 12 },
    { gio: '04:00', nguoiDung: 8 },
    { gio: '08:00', nguoiDung: 45 },
    { gio: '12:00', nguoiDung: 78 },
    { gio: '16:00', nguoiDung: 92 },
    { gio: '20:00', nguoiDung: 65 },
    { gio: '23:00', nguoiDung: 32 },
  ];

  const workflowTypeData = [
    { name: 'Telegram Bots', value: 45, color: '#ff6b35' },
    { name: 'Xử lý dữ liệu', value: 30, color: '#f7931e' },
    { name: 'Tích hợp API', value: 15, color: '#fdc830' },
    { name: 'Tác vụ định kỳ', value: 10, color: '#37b7c3' },
  ];

  if (loading) {
    return <div className="admin-loading">Đang tải bảng điều khiển...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Bảng Điều Khiển Quản Trị</h1>
        <p>Tổng quan nền tảng workflow</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tổng Người Dùng</p>
            <h3 className="stat-value">{stats?.totalUsers || 0}</h3>
            <div className={`stat-change ${(stats?.userGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.userGrowth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(stats?.userGrowth || 0)}% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Workflow size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Workflow Hoạt Động</p>
            <h3 className="stat-value">{stats?.activeWorkflows || 0}</h3>
            <div className={`stat-change ${(stats?.workflowGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.workflowGrowth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(stats?.workflowGrowth || 0)}% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Play size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tổng Lượt Thực Thi</p>
            <h3 className="stat-value">{stats?.totalExecutions || 0}</h3>
            <div className={`stat-change ${(stats?.executionGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.executionGrowth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(stats?.executionGrowth || 0)}% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tỷ Lệ Thành Công</p>
            <h3 className="stat-value">{stats?.successRate || 0}%</h3>
            <div className="stat-change positive">
              <TrendingUp size={14} />
              <span>Hiệu suất xuất sắc</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <div className="chart-header">
            <h3>Xu Hướng Thực Thi</h3>
            <p>7 ngày qua</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={executionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
              <XAxis dataKey="name" stroke="#8b92b8" />
              <YAxis stroke="#8b92b8" />
              <Tooltip 
                contentStyle={{ background: '#1f2744', border: '1px solid #2a3350', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="thanhCong" name="Thành công" fill="#43e97b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="thatBai" name="Thất bại" fill="#f5576c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <div className="chart-header">
            <h3>Hoạt Động Người Dùng</h3>
            <p>Hôm nay</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
              <XAxis dataKey="gio" stroke="#8b92b8" />
              <YAxis stroke="#8b92b8" />
              <Tooltip 
                contentStyle={{ background: '#1f2744', border: '1px solid #2a3350', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="nguoiDung" name="Người dùng" stroke="#4facfe" strokeWidth={3} dot={{ fill: '#4facfe', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <div className="chart-header">
            <h3>Loại Workflow</h3>
            <p>Phân bổ</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workflowTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {workflowTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#1f2744', border: '1px solid #2a3350', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
