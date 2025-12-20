import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Lock, Unlock, Calendar, Shield, UserX } from 'lucide-react';
import './AdminComponents.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  workflowCount?: number;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <div>Đang tải danh sách users...</div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="management-header">
        <div className="header-left">
          <Users size={24} />
          <div>
            <h2>Quản lý Users</h2>
            <p>{filteredUsers.length} users</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as any)}>
            <option value="all">Tất cả roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Workflows</th>
              <th>Đăng ký</th>
              <th>Đăng nhập cuối</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <div className={`user-avatar ${user.role}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <strong>{user.name}</strong>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? <Shield size={14} /> : <Users size={14} />}
                    {user.role}
                  </span>
                </td>
                <td>{user.workflowCount || 0}</td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </td>
                <td>
                  {user.lastLogin ? (
                    <div className="date-cell">
                      <Calendar size={14} />
                      {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                    </div>
                  ) : (
                    <span className="no-data">Chưa đăng nhập</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn toggle"
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                      title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      {user.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user._id)}
                      title="Xóa user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-data-message">
            <UserX size={48} />
            <p>Không tìm thấy user nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
