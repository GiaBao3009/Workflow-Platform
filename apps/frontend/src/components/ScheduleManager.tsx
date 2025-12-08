import { useState, useEffect } from 'react'
import { workflowApi } from '../services/api'
import './ScheduleManager.css'

interface Schedule {
  _id: string
  workflowId: string
  temporalScheduleId: string
  name: string
  description?: string
  cronExpression: string
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ScheduleManagerProps {
  workflowId: string
}

const ScheduleManager = ({ workflowId }: ScheduleManagerProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cronExpression: '',
    timezone: 'UTC',
  })

  // CRON presets
  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at 9 AM', value: '0 9 * * *' },
    { label: 'Every day at 6 PM', value: '0 18 * * *' },
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
    { label: 'Every 1st of month', value: '0 0 1 * *' },
  ]

  useEffect(() => {
    if (workflowId) {
      loadSchedules()
    }
  }, [workflowId])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await workflowApi.getSchedules(workflowId)
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Failed to load schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await workflowApi.createSchedule(workflowId, formData)
      setShowForm(false)
      setFormData({ name: '', description: '', cronExpression: '', timezone: 'UTC' })
      await loadSchedules()
    } catch (error) {
      console.error('Failed to create schedule:', error)
      alert('Failed to create schedule. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseSchedule = async (scheduleId: string) => {
    try {
      await workflowApi.pauseSchedule(scheduleId)
      await loadSchedules()
    } catch (error) {
      console.error('Failed to pause schedule:', error)
    }
  }

  const handleResumeSchedule = async (scheduleId: string) => {
    try {
      await workflowApi.resumeSchedule(scheduleId)
      await loadSchedules()
    } catch (error) {
      console.error('Failed to resume schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return
    }

    try {
      await workflowApi.deleteSchedule(scheduleId)
      await loadSchedules()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handlePresetClick = (cronValue: string) => {
    setFormData({ ...formData, cronExpression: cronValue })
  }

  if (!workflowId) {
    return (
      <div className="schedule-manager">
        <div className="empty-state">
          <p>Chọn một workflow để quản lý lịch chạy</p>
        </div>
      </div>
    )
  }

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <h3>📅 Lịch chạy tự động</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Đóng' : '+ Tạo lịch mới'}
        </button>
      </div>

      {showForm && (
        <div className="schedule-form-container">
          <form onSubmit={handleCreateSchedule} className="schedule-form">
            <div className="form-group">
              <label>Tên lịch *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daily Report at 9 AM"
                required
              />
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="form-group">
              <label>CRON Expression *</label>
              <input
                type="text"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                placeholder="e.g., 0 9 * * *"
                required
              />
              <small className="form-help">
                Format: minute hour day month dayOfWeek
                <a href="https://crontab.guru" target="_blank" rel="noopener noreferrer">
                  {' '}🔗 Crontab Guru
                </a>
              </small>
            </div>

            <div className="cron-presets">
              <label>Hoặc chọn mẫu có sẵn:</label>
              <div className="preset-buttons">
                {cronPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    className="btn-preset"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Đang tạo...' : '✅ Tạo lịch'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm && (
        <div className="loading-state">
          <p>⏳ Đang tải...</p>
        </div>
      )}

      {!loading && schedules.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>Chưa có lịch chạy nào</p>
          <small>Click "+ Tạo lịch mới" để thiết lập lịch chạy tự động</small>
          <button
            className="btn btn-primary btn-create-schedule"
            onClick={() => setShowForm(true)}
          >
            + Tạo lịch mới
          </button>
        </div>
      )}

      {!loading && schedules.length > 0 && (
        <div className="schedules-list">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="schedule-item">
              <div className="schedule-info">
                <div className="schedule-name">
                  <strong>{schedule.name}</strong>
                  {!schedule.isActive && <span className="badge-paused">⏸️ Paused</span>}
                </div>
                {schedule.description && (
                  <p className="schedule-description">{schedule.description}</p>
                )}
                <div className="schedule-details">
                  <span className="schedule-cron">
                    🕐 <code>{schedule.cronExpression}</code>
                  </span>
                  <span className="schedule-timezone">🌍 {schedule.timezone}</span>
                </div>
              </div>

              <div className="schedule-actions">
                {schedule.isActive ? (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => handlePauseSchedule(schedule._id)}
                  >
                    ⏸️ Pause
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleResumeSchedule(schedule._id)}
                  >
                    ▶️ Resume
                  </button>
                )}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteSchedule(schedule._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduleManager
