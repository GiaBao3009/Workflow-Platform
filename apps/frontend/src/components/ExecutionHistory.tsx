import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { workflowApi } from '../services/api'
import './ExecutionHistory.css'

interface ExecutionHistoryProps {
  workflowId: string
}

const ExecutionHistory = forwardRef(({ workflowId }: ExecutionHistoryProps, ref) => {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    if (workflowId) {
      loadRuns()
      
      // Auto-refresh mỗi 5 giây nếu có runs đang RUNNING
      const interval = setInterval(() => {
        loadRuns()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [workflowId])

  const loadRuns = async () => {
    setLoading(true)
    try {
      const data = await workflowApi.getRuns(workflowId)
      setRuns(data.runs || [])
    } catch (error) {
      console.error('Failed to load runs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Expose loadRuns to parent component
  useImperativeHandle(ref, () => ({
    loadRuns
  }))

  const handleViewDetail = async (runId: string) => {
    try {
      const data = await workflowApi.getRunDetail(runId)
      setSelectedRun(data.run)
      setShowDetail(true)
      
      // Update run trong danh sách để sync status
      setRuns(prevRuns => 
        prevRuns.map(run => 
          run._id === runId ? data.run : run
        )
      )
    } catch (error) {
      console.error('Failed to load run detail:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; icon: string; text: string }> = {
      SUCCESS: { className: 'status-success', icon: '✅', text: 'Thành công' },
      COMPLETED: { className: 'status-success', icon: '✅', text: 'Thành công' },
      FAILED: { className: 'status-failed', icon: '❌', text: 'Thất bại' },
      FAILURE: { className: 'status-failed', icon: '❌', text: 'Thất bại' },
      RUNNING: { className: 'status-running', icon: '⏳', text: 'Đang chạy' },
      PENDING: { className: 'status-running', icon: '⏳', text: 'Đang chờ' },
    }
    const badge = badges[status] || { className: 'status-unknown', icon: '❓', text: status }
    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    )
  }

  if (!workflowId) {
    return (
      <div className="execution-history">
        <div className="empty-state">
          <p>Chọn một workflow để xem lịch sử thực thi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="execution-history">
      <div className="history-header">
        <h3>📊 Lịch sử thực thi</h3>
        <button className="btn btn-secondary btn-sm" onClick={loadRuns}>
          🔄 Làm mới
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <p>⏳ Đang tải...</p>
        </div>
      )}

      {!loading && runs.length === 0 && (
        <div className="empty-state">
          <p>Chưa có lần chạy nào</p>
          <small>Click "▶️ Chạy Thử" để thực thi workflow</small>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div className="runs-list">
          {runs.map((run) => (
            <div key={run._id} className="run-item">
              <div className="run-header">
                <div className="run-info">
                  <strong>Run #{run._id.slice(-8)}</strong>
                  <span className="run-time">{formatDate(run.startTime)}</span>
                </div>
                {getStatusBadge(run.status)}
              </div>

              <div className="run-details">
                <div className="run-field">
                  <strong>Temporal ID:</strong>
                  <code>{run.temporalWorkflowId}</code>
                </div>
                {run.endTime && (
                  <div className="run-field">
                    <strong>Kết thúc:</strong>
                    <span>{formatDate(run.endTime)}</span>
                  </div>
                )}
              </div>

              <div className="run-actions">
                <button
                  className="btn btn-link btn-sm"
                  onClick={() => handleViewDetail(run._id)}
                >
                  👁️ Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedRun && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết Run</h3>
              <button className="close-btn" onClick={() => setShowDetail(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Thông tin chung</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Run ID:</strong>
                    <code>{selectedRun._id}</code>
                  </div>
                  <div className="detail-item">
                    <strong>Temporal Workflow ID:</strong>
                    <code>{selectedRun.temporalWorkflowId}</code>
                  </div>
                  <div className="detail-item">
                    <strong>Trạng thái:</strong>
                    {getStatusBadge(selectedRun.status)}
                  </div>
                  <div className="detail-item">
                    <strong>Bắt đầu:</strong>
                    <span>{formatDate(selectedRun.startTime)}</span>
                  </div>
                  {selectedRun.endTime && (
                    <div className="detail-item">
                      <strong>Kết thúc:</strong>
                      <span>{formatDate(selectedRun.endTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRun.result && (
                <div className="detail-section">
                  <h4>Kết quả</h4>
                  <pre className="result-json">
                    {JSON.stringify(selectedRun.result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedRun.error && (
                <div className="detail-section error-section">
                  <h4>❌ Lỗi chi tiết</h4>
                  <div className="error-box">
                    <p><strong>Thông báo:</strong> {selectedRun.error}</p>
                  </div>
                </div>
              )}

              {selectedRun.errorDetails && (
                <div className="detail-section error-section">
                  <h4>❌ Chi tiết lỗi</h4>
                  <div className="error-box">
                    <div className="error-item">
                      <strong>Thông báo:</strong>
                      <p>{selectedRun.errorDetails.message}</p>
                    </div>
                    {selectedRun.errorDetails.failedActivityName && (
                      <div className="error-item">
                        <strong>Activity bị lỗi:</strong>
                        <code className="error-code">{selectedRun.errorDetails.failedActivityName}</code>
                      </div>
                    )}
                    {selectedRun.errorDetails.stack && (
                      <div className="error-item">
                        <strong>Stack trace:</strong>
                        <pre className="error-stack">{selectedRun.errorDetails.stack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hiển thị chi tiết thực thi từng bước */}
              {selectedRun.executionDetails && selectedRun.executionDetails.length > 0 ? (
                <div className="detail-section">
                  <h4>📋 Chi tiết thực thi từng bước ({selectedRun.executionDetails.length} bước)</h4>
                  <div className="execution-timeline">
                    {selectedRun.executionDetails.map((detail: any, index: number) => (
                      <div 
                        key={index} 
                        className={`execution-step ${detail.status === 'FAILURE' ? 'step-failed' : 'step-success'}`}
                      >
                        <div className="step-header">
                          <span className="step-number">{index + 1}</span>
                          <div className="step-info">
                            <div className="step-name-row">
                              <span className="step-name">{detail.activityName}</span>
                              <span className="step-type">{detail.nodeType}</span>
                            </div>
                            <div className="step-timing">
                              <span className="step-time">
                                🕐 {new Date(detail.startTime).toLocaleTimeString('vi-VN')} 
                                → {new Date(detail.endTime).toLocaleTimeString('vi-VN')}
                              </span>
                              <span className="step-duration">⏱️ {detail.executionTime}ms</span>
                            </div>
                          </div>
                          <span className={`step-status ${detail.status === 'FAILURE' ? 'status-failed' : 'status-success'}`}>
                            {detail.status === 'FAILURE' ? '❌ Thất bại' : '✅ Thành công'}
                          </span>
                        </div>
                        
                        {detail.output && (
                          <div className="step-output">
                            <strong>📤 Output:</strong>
                            <pre>{JSON.stringify(detail.output, null, 2)}</pre>
                          </div>
                        )}
                        
                        {detail.error && (
                          <div className="step-error">
                            <strong>❌ Error:</strong>
                            <div className="error-details">
                              <p className="error-message">{detail.error.message}</p>
                              {detail.error.code && (
                                <div className="error-code-box">
                                  <strong>Code:</strong> <code>{detail.error.code}</code>
                                </div>
                              )}
                              {detail.error.stack && (
                                <details className="error-stack-details">
                                  <summary>View stack trace</summary>
                                  <pre className="error-stack-trace">{detail.error.stack}</pre>
                                </details>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <h4>📋 Chi tiết thực thi từng bước</h4>
                  <div className="no-execution-details">
                    <span className="no-details-icon">📊</span>
                    <p>Chưa có dữ liệu chi tiết thực thi</p>
                    <small>
                      {selectedRun.status === 'RUNNING' 
                        ? 'Workflow đang chạy, hãy chờ hoàn thành...'
                        : 'Workflow này có thể đã chạy trước khi tính năng này được thêm vào'
                      }
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ExecutionHistory.displayName = 'ExecutionHistory'

export default ExecutionHistory
