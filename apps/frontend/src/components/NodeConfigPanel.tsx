import { useState, useEffect } from 'react'
import { Node, Edge } from 'reactflow'
import './NodeConfigPanel.css'

interface NodeConfigPanelProps {
  node: Node | null
  nodes: Node[]  // All nodes để tìm previous nodes
  edges: Edge[]  // All edges để trace connections
  onClose: () => void
  onSave: (nodeId: string, data: any) => void
}

export default function NodeConfigPanel({ node, nodes, edges, onClose, onSave }: NodeConfigPanelProps) {
  const [formData, setFormData] = useState<any>({})
  const [showVariables, setShowVariables] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)

  useEffect(() => {
    if (node) {
      setFormData(node.data || {})
    }
  }, [node])

  if (!node) return null

  // Get previous nodes (nodes connected before current node)
  const getPreviousNodes = (): Node[] => {
    if (!node) return []
    
    const incomingEdges = edges.filter(e => e.target === node.id)
    const previousNodeIds = incomingEdges.map(e => e.source)
    
    return nodes.filter(n => 
      previousNodeIds.includes(n.id) && 
      n.type !== 'input' && 
      n.type !== 'output'
    )
  }

  // Get available variables from previous nodes
  const getAvailableVariables = (): { nodeId: string; nodeType: string; variables: string[] }[] => {
    const previousNodes = getPreviousNodes()
    
    return previousNodes.map(prevNode => {
      let variables: string[] = []
      
      switch (prevNode.type) {
        case 'httpRequest':
          variables = [
            'status',      // HTTP status code
            'data',        // Response body (nested object)
            'headers',     // Response headers
          ]
          break
        case 'database':
          variables = [
            'data',        // Query results or inserted/updated data
            'count',       // Number of results (for find)
            'insertedId',  // Inserted ID (for insertOne)
            'modifiedCount', // Modified count (for updateOne)
            'deletedCount', // Deleted count (for deleteOne)
            'found',       // Boolean (for findOne)
          ]
          break
        case 'email':
          variables = [
            'messageId',   // Email message ID
            'sent',        // Boolean sent status
            'mock',        // Boolean if mock mode
          ]
          break
        case 'conditional':
          variables = [
            'result',      // Boolean result
            'branch',      // 'true' or 'false'
            'fieldValue',  // Actual field value checked
          ]
          break
        case 'delay':
          variables = [
            'delayed',     // Delay duration
          ]
          break
        case 'telegram':
          variables = [
            'messageId',   // Telegram message ID
            'sent',        // Boolean sent status
            'chatId',      // Chat ID
          ]
          break
        case 'chatgpt':
          variables = [
            'response',    // AI response text
            'model',       // Model used
            'tokens',      // Tokens used
          ]
          break
        case 'gemini':
          variables = [
            'response',    // AI response text
            'model',       // Model used
            'tokens',      // Tokens used
          ]
          break
        case 'contentFilter':
          variables = [
            'passed',          // Boolean (true if clean)
            'matchedKeywords', // Array of matched keywords
            'inputText',       // Original input
          ]
          break
        case 'googleSheets':
          variables = [
            'values',         // 2D array of cell values
            'rowCount',       // Number of rows
            'columnCount',    // Number of columns
            'updatedRange',   // Range that was updated (e.g., Sheet1!A1:C10)
          ]
          break
      }
      
      return {
        nodeId: prevNode.id,
        nodeType: prevNode.type || 'unknown',
        variables,
      }
    })
  }

  // Insert variable into active field
  const insertVariable = (nodeId: string, variable: string) => {
    if (!activeField) return
    
    const variableSyntax = `{{${nodeId}.${variable}}}`
    const currentValue = formData[activeField] || ''
    
    // Insert at cursor or append
    updateField(activeField, currentValue + variableSyntax)
    setShowVariables(false)
  }

  const handleSave = () => {
    onSave(node.id, formData)
    onClose()
  }

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const openVariableHelper = (fieldName: string) => {
    setActiveField(fieldName)
    setShowVariables(true)
  }

  const renderForm = () => {
    switch (node.type) {
      case 'httpRequest':
        return (
          <>
            <div className="form-group">
              <label>Method</label>
              <select 
                value={formData.method || 'GET'}
                onChange={(e) => updateField('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="form-group">
              <label>URL *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="https://api.example.com/endpoint"
                  value={formData.url || ''}
                  onChange={(e) => updateField('url', e.target.value)}
                  onFocus={() => setActiveField('url')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('url')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Headers (JSON)</label>
              <div className="input-with-helper">
                <textarea
                  placeholder='{"Content-Type": "application/json"}'
                  value={formData.headers || ''}
                  onChange={(e) => updateField('headers', e.target.value)}
                  onFocus={() => setActiveField('headers')}
                  rows={3}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('headers')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Body (JSON)</label>
              <div className="input-with-helper">
                <textarea
                  placeholder='{"key": "value"}'
                  value={formData.body || ''}
                  onChange={(e) => updateField('body', e.target.value)}
                  onFocus={() => setActiveField('body')}
                  rows={4}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('body')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
          </>
        )

      case 'database':
        return (
          <>
            <div className="form-group">
              <label>Loại thao tác</label>
              <select 
                value={formData.operation || 'find'}
                onChange={(e) => updateField('operation', e.target.value)}
              >
                <option value="find">Find (tìm nhiều)</option>
                <option value="findOne">Find One (tìm 1)</option>
                <option value="insertOne">Insert One (thêm mới)</option>
                <option value="updateOne">Update One (cập nhật)</option>
                <option value="deleteOne">Delete One (xóa)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Collection *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="users, orders, products..."
                  value={formData.collection || ''}
                  onChange={(e) => updateField('collection', e.target.value)}
                  onFocus={() => setActiveField('collection')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('collection')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Filter (JSON) {formData.operation === 'insertOne' ? '(không cần)' : ''}</label>
              <div className="input-with-helper">
                <textarea
                  placeholder='{"email": "{{http-1.data.email}}"}'
                  value={formData.filter || ''}
                  onChange={(e) => updateField('filter', e.target.value)}
                  onFocus={() => setActiveField('filter')}
                  rows={3}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('filter')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Ví dụ: {`{"userId": "123"}` }, {`{"status": "active"}`}</small>
            </div>
            {(formData.operation === 'insertOne' || formData.operation === 'updateOne') && (
              <div className="form-group">
                <label>Data (JSON) *</label>
                <div className="input-with-helper">
                  <textarea
                    placeholder='{"name": "{{http-1.data.name}}", "email": "{{http-1.data.email}}"}'
                    value={formData.data || ''}
                    onChange={(e) => updateField('data', e.target.value)}
                    onFocus={() => setActiveField('data')}
                    rows={4}
                  />
                  {getPreviousNodes().length > 0 && (
                    <button 
                      type="button"
                      className="helper-btn"
                      onClick={() => openVariableHelper('data')}
                      title="Chèn biến"
                    >
                      📦
                    </button>
                  )}
                </div>
                <small className="hint">Dữ liệu để insert hoặc update</small>
              </div>
            )}
          </>
        )

      case 'email':
        return (
          <>
            <div className="form-group">
              <label>Người nhận (To) *</label>
              <div className="input-with-helper">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.to || ''}
                  onChange={(e) => updateField('to', e.target.value)}
                  onFocus={() => setActiveField('to')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('to')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>CC (tùy chọn)</label>
              <input
                type="text"
                placeholder="cc1@example.com, cc2@example.com"
                value={formData.cc || ''}
                onChange={(e) => updateField('cc', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tiêu đề *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="Thông báo workflow hoàn thành"
                  value={formData.subject || ''}
                  onChange={(e) => updateField('subject', e.target.value)}
                  onFocus={() => setActiveField('subject')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('subject')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Nội dung Email</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="Xin chào,&#10;&#10;Workflow đã hoàn thành thành công.&#10;&#10;Trân trọng,"
                  value={formData.body || ''}
                  onChange={(e) => updateField('body', e.target.value)}
                  onFocus={() => setActiveField('body')}
                  rows={6}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('body')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
            </div>
          </>
        )

      case 'delay':
        return (
          <>
            <div className="form-group">
              <label>Thời gian chờ *</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={formData.duration || ''}
                onChange={(e) => updateField('duration', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Đơn vị thời gian</label>
              <select 
                value={formData.unit || 'giây'}
                onChange={(e) => updateField('unit', e.target.value)}
              >
                <option value="giây">Giây</option>
                <option value="phút">Phút</option>
                <option value="giờ">Giờ</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea
                placeholder="Mô tả lý do trì hoãn..."
                value={formData.note || ''}
                onChange={(e) => updateField('note', e.target.value)}
                rows={2}
              />
            </div>
          </>
        )

      case 'conditional':
        return (
          <>
            <div className="form-group">
              <label>Field để kiểm tra *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="{{http-1.data.status}} hoặc {{http-1.status}}"
                  value={formData.field || ''}
                  onChange={(e) => updateField('field', e.target.value)}
                  onFocus={() => setActiveField('field')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('field')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Ví dụ: {`{{http-1.status}}`}, {`{{db-1.data.count}}`}</small>
            </div>
            <div className="form-group">
              <label>Toán tử so sánh</label>
              <select 
                value={formData.operator || '=='}
                onChange={(e) => updateField('operator', e.target.value)}
              >
                <option value="==">Bằng (==)</option>
                <option value="!=">Không bằng (!=)</option>
                <option value=">">Lớn hơn (&gt;)</option>
                <option value="<">Nhỏ hơn (&lt;)</option>
                <option value=">=">Lớn hơn hoặc bằng (&gt;=)</option>
                <option value="<=">Nhỏ hơn hoặc bằng (&lt;=)</option>
                <option value="contains">Chứa (contains)</option>
                <option value="exists">Tồn tại (exists)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Giá trị so sánh</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="200, 'active', true, {{http-1.data.value}}"
                  value={formData.value || ''}
                  onChange={(e) => updateField('value', e.target.value)}
                  onFocus={() => setActiveField('value')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('value')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Giá trị để so sánh (nếu operator là 'exists' thì không cần)</small>
            </div>
            <div className="info-box">
              <strong>💡 Cách hoạt động:</strong><br/>
              • Nhánh TRUE: Kết nối node chạy khi điều kiện đúng<br/>
              • Nhánh FALSE: Kết nối node chạy khi điều kiện sai<br/>
              • Ví dụ: {`{{http-1.status}} == 200`} → nếu HTTP status là 200 thì đúng
            </div>
          </>
        )

      case 'telegram':
        return (
          <>
            <div className="form-group">
              <label>Chat ID *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="{{webhook.message.chat.id}} hoặc số chat ID"
                  value={formData.chatId || ''}
                  onChange={(e) => updateField('chatId', e.target.value)}
                  onFocus={() => setActiveField('chatId')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('chatId')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Lấy từ webhook: {`{{webhook.message.chat.id}}`}</small>
            </div>
            <div className="form-group">
              <label>Tin nhắn *</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="Xin chào! {{chatgpt-1.response}}"
                  value={formData.text || ''}
                  onChange={(e) => updateField('text', e.target.value)}
                  onFocus={() => setActiveField('text')}
                  rows={5}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('text')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Có thể dùng biến từ ChatGPT: {`{{chatgpt-1.response}}`}</small>
            </div>
            <div className="form-group">
              <label>Parse Mode</label>
              <select 
                value={formData.parseMode || 'None'}
                onChange={(e) => updateField('parseMode', e.target.value)}
              >
                <option value="None">None</option>
                <option value="Markdown">Markdown</option>
                <option value="HTML">HTML</option>
              </select>
              <small className="hint">Format cho tin nhắn (hỗ trợ bold, italic, link...)</small>
            </div>
            <div className="info-box">
              <strong>💡 Bot Token được lưu an toàn trong biến môi trường</strong><br/>
              Bạn chỉ cần cấu hình Chat ID và nội dung tin nhắn.
            </div>
          </>
        )

      case 'chatgpt':
        return (
          <>
            <div className="form-group">
              <label>Model</label>
              <select 
                value={formData.model || 'gpt-3.5-turbo'}
                onChange={(e) => updateField('model', e.target.value)}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rẻ, nhanh)</option>
                <option value="gpt-4">GPT-4 (Thông minh hơn, đắt hơn)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
            <div className="form-group">
              <label>System Prompt</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="Bạn là trợ lý AI thân thiện, trả lời bằng tiếng Việt..."
                  value={formData.systemPrompt || ''}
                  onChange={(e) => updateField('systemPrompt', e.target.value)}
                  onFocus={() => setActiveField('systemPrompt')}
                  rows={3}
                />
              </div>
              <small className="hint">Hướng dẫn AI về vai trò và cách trả lời</small>
            </div>
            <div className="form-group">
              <label>User Message *</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="{{webhook.message.text}} hoặc câu hỏi cố định"
                  value={formData.userMessage || ''}
                  onChange={(e) => updateField('userMessage', e.target.value)}
                  onFocus={() => setActiveField('userMessage')}
                  rows={4}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('userMessage')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Tin nhắn từ user: {`{{webhook.message.text}}`}</small>
            </div>
            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                placeholder="500"
                value={formData.maxTokens || 500}
                onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                min={1}
                max={4000}
              />
              <small className="hint">Số token tối đa cho response (1 token ≈ 4 ký tự)</small>
            </div>
            <div className="form-group">
              <label>Temperature</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.7"
                value={formData.temperature || 0.7}
                onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                min={0}
                max={2}
              />
              <small className="hint">0 = chính xác, 1 = sáng tạo, 2 = rất ngẫu nhiên</small>
            </div>
            <div className="info-box">
              <strong>🔑 OpenAI API Key được lưu trong biến môi trường</strong><br/>
              Output: {`{{chatgpt-X.response}}`} - Phản hồi từ AI
            </div>
          </>
        )

      case 'gemini':
        return (
          <>
            <div className="form-group">
              <label>Model</label>
              <select 
                value={formData.model || 'gemini-pro'}
                onChange={(e) => updateField('model', e.target.value)}
              >
                <option value="gemini-pro">Gemini Pro (MIỄN PHÍ)</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
              </select>
            </div>
            <div className="form-group">
              <label>System Prompt</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="Bạn là trợ lý AI thân thiện, trả lời bằng tiếng Việt..."
                  value={formData.systemPrompt || ''}
                  onChange={(e) => updateField('systemPrompt', e.target.value)}
                  onFocus={() => setActiveField('systemPrompt')}
                  rows={3}
                />
              </div>
              <small className="hint">Hướng dẫn AI về vai trò và cách trả lời</small>
            </div>
            <div className="form-group">
              <label>User Message *</label>
              <div className="input-with-helper">
                <textarea
                  placeholder="{{webhook.message.text}} hoặc câu hỏi cố định"
                  value={formData.userMessage || ''}
                  onChange={(e) => updateField('userMessage', e.target.value)}
                  onFocus={() => setActiveField('userMessage')}
                  rows={4}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('userMessage')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Tin nhắn từ user: {`{{webhook.message.text}}`}</small>
            </div>
            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                placeholder="2048"
                value={formData.maxTokens || 2048}
                onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                min={1}
                max={8000}
              />
              <small className="hint">Số token tối đa cho response (Gemini hỗ trợ tới 8K tokens)</small>
            </div>
            <div className="form-group">
              <label>Temperature</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.7"
                value={formData.temperature || 0.7}
                onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                min={0}
                max={2}
              />
              <small className="hint">0 = chính xác, 1 = sáng tạo, 2 = rất ngẫu nhiên</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.useConversationHistory || false}
                  onChange={(e) => updateField('useConversationHistory', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Sử dụng Conversation History
              </label>
              <small className="hint">Gemini sẽ nhớ lịch sử chat để trả lời có ngữ cảnh</small>
            </div>

            {formData.useConversationHistory && (
              <div className="form-group">
                <label>Chat ID *</label>
                <div className="input-with-helper">
                  <input
                    type="text"
                    placeholder="{{webhook.message.chat.id}}"
                    value={formData.chatId || ''}
                    onChange={(e) => updateField('chatId', e.target.value)}
                    onFocus={() => setActiveField('chatId')}
                  />
                  {getPreviousNodes().length > 0 && (
                    <button 
                      type="button"
                      className="helper-btn"
                      onClick={() => openVariableHelper('chatId')}
                      title="Chèn biến"
                    >
                      📦
                    </button>
                  )}
                </div>
                <small className="hint">ID để phân biệt từng cuộc hội thoại: {`{{webhook.message.chat.id}}`}</small>
              </div>
            )}

            <div className="info-box">
              <strong>✨ Google Gemini API - MIỄN PHÍ 60 requests/phút</strong><br/>
              Output: {`{{gemini-X.response}}`} - Phản hồi từ AI<br/>
              {formData.useConversationHistory && (
                <><br/><strong>💬 Conversation Memory:</strong> Gemini sẽ nhớ lịch sử chat (tối đa 50 tin nhắn)</>
              )}
            </div>
          </>
        )

      case 'contentFilter':
        return (
          <>
            <div className="form-group">
              <label>Nội dung cần kiểm tra *</label>
              <div className="input-with-helper">
                <input
                  type="text"
                  placeholder="{{webhook.message.text}}"
                  value={formData.inputText || ''}
                  onChange={(e) => updateField('inputText', e.target.value)}
                  onFocus={() => setActiveField('inputText')}
                />
                {getPreviousNodes().length > 0 && (
                  <button 
                    type="button"
                    className="helper-btn"
                    onClick={() => openVariableHelper('inputText')}
                    title="Chèn biến"
                  >
                    📦
                  </button>
                )}
              </div>
              <small className="hint">Text cần lọc: {`{{webhook.message.text}}`}</small>
            </div>
            <div className="form-group">
              <label>Từ khóa nhạy cảm (mỗi dòng 1 từ) *</label>
              <textarea
                placeholder={'tự tử\nchết\nsex\nporn\nma túy\ngiết'}
                value={formData.keywords || ''}
                onChange={(e) => updateField('keywords', e.target.value)}
                rows={6}
              />
              <small className="hint">Nhập mỗi từ khóa một dòng</small>
            </div>
            <div className="form-group">
              <label>Tin nhắn cảnh báo</label>
              <textarea
                placeholder="⚠️ Xin lỗi, tôi không thể hỗ trợ về vấn đề này."
                value={formData.rejectionMessage || ''}
                onChange={(e) => updateField('rejectionMessage', e.target.value)}
                rows={3}
              />
              <small className="hint">Tin nhắn khi phát hiện nội dung nhạy cảm</small>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.caseSensitive || false}
                  onChange={(e) => updateField('caseSensitive', e.target.checked)}
                />
                <span>Phân biệt chữ hoa/thường</span>
              </label>
            </div>
            <div className="info-box">
              <strong>💡 Cách hoạt động:</strong><br/>
              • Nhánh PASS (trái): Nội dung sạch → chạy tiếp ChatGPT<br/>
              • Nhánh REJECT (phải): Có từ nhạy cảm → gửi cảnh báo<br/>
              Output: {`{{filter-X.passed}}`} (boolean), {`{{filter-X.matchedKeywords}}`} (array)
            </div>
          </>
        )

      case 'googleSheets':
        return (
          <>
            <div className="form-group">
              <label>Spreadsheet ID *</label>
              <input
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdD4dIjWbC1TqMFcXJY9-zK8s"
                value={formData.spreadsheetId || ''}
                onChange={(e) => updateField('spreadsheetId', e.target.value)}
              />
              <small className="hint">Lấy từ URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit</small>
            </div>

            <div className="form-group">
              <label>Thao tác</label>
              <select 
                value={formData.action || 'READ'}
                onChange={(e) => updateField('action', e.target.value)}
              >
                <option value="READ">READ - Đọc dữ liệu</option>
                <option value="WRITE">WRITE - Ghi đè dữ liệu</option>
                <option value="APPEND">APPEND - Thêm dòng mới</option>
                <option value="CLEAR">CLEAR - Xóa dữ liệu</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tên Sheet</label>
              <input
                type="text"
                placeholder="Sheet1"
                value={formData.sheetName || ''}
                onChange={(e) => updateField('sheetName', e.target.value)}
              />
              <small className="hint">Tên tab trong spreadsheet (mặc định: Sheet1)</small>
            </div>

            <div className="form-group">
              <label>Range (A1 notation)</label>
              <input
                type="text"
                placeholder="A1:C10"
                value={formData.range || ''}
                onChange={(e) => updateField('range', e.target.value)}
              />
              <small className="hint">Ví dụ: A1:C10, A:Z (toàn bộ cột), 2:5 (dòng 2-5)</small>
            </div>

            {(formData.action === 'WRITE' || formData.action === 'APPEND') && (
              <div className="form-group">
                <label>Dữ liệu (JSON Array) *</label>
                <div className="input-with-helper">
                  <textarea
                    rows={5}
                    placeholder='[["Tên", "Email"], ["John", "john@example.com"]]'
                    value={formData.values || ''}
                    onChange={(e) => updateField('values', e.target.value)}
                    onFocus={() => setActiveField('values')}
                  />
                  {getPreviousNodes().length > 0 && (
                    <button 
                      type="button"
                      className="helper-btn"
                      onClick={() => openVariableHelper('values')}
                      title="Chèn biến"
                    >
                      📦
                    </button>
                  )}
                </div>
                <small className="hint">2D array: {`[["{{webhook.timestamp}}", "{{webhook.user}}"]]`}</small>
              </div>
            )}

            <div className="info-box">
              <strong>📊 Google Sheets Operations:</strong><br/>
              • <strong>READ:</strong> Đọc dữ liệu từ sheet<br/>
              • <strong>WRITE:</strong> Ghi đè dữ liệu (thay thế existing)<br/>
              • <strong>APPEND:</strong> Thêm dòng mới vào cuối<br/>
              • <strong>CLEAR:</strong> Xóa dữ liệu trong range<br/><br/>
              Output: {`{{sheets-X.values}}`}, {`{{sheets-X.rowCount}}`}, {`{{sheets-X.updatedRange}}`}
            </div>
          </>
        )

      default:
        return <p>Node type không được hỗ trợ</p>
    }
  }

  const getNodeTitle = () => {
    const titles: Record<string, string> = {
      httpRequest: '🌐 Cấu hình HTTP Request',
      database: '💾 Cấu hình Database',
      email: '📧 Cấu hình Email',
      delay: '⏰ Cấu hình Delay',
      conditional: '🔀 Cấu hình Điều kiện',
      telegram: '✈️ Cấu hình Telegram',
      chatgpt: '🤖 Cấu hình ChatGPT',
      gemini: '✨ Cấu hình Gemini AI',
      contentFilter: '🛡️ Cấu hình Lọc Nội Dung',
      googleSheets: '📊 Cấu hình Google Sheets',
    }
    return titles[node.type || ''] || 'Cấu hình Node'
  }

  return (
    <div className="config-panel-overlay" onClick={onClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h3>{getNodeTitle()}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="config-body">
          {/* Info box for variables */}
          {getPreviousNodes().length > 0 && (
            <div className="info-box variables-info">
              <strong>💡 Có thể sử dụng dữ liệu từ các node trước:</strong>
              <div className="quick-variables">
                {getAvailableVariables().map(({ nodeId }) => (
                  <span key={nodeId} className="quick-var-tag">
                    {nodeId}
                  </span>
                ))}
              </div>
              <button 
                className="btn-link"
                onClick={() => setShowVariables(!showVariables)}
              >
                {showVariables ? '❌ Ẩn danh sách biến' : '📦 Xem danh sách biến'}
              </button>
            </div>
          )}

          {/* Variable Helper - Moved inside config-body */}
          {showVariables && (
            <div className="variable-helper">
              <div className="variable-header">
                <h4>📦 Chèn dữ liệu từ node trước</h4>
                <button onClick={() => setShowVariables(false)}>✕</button>
              </div>
              <div className="variable-list">
                {getAvailableVariables().length === 0 ? (
                  <p className="no-variables">Không có node nào kết nối trước node này</p>
                ) : (
                  getAvailableVariables().map(({ nodeId, nodeType, variables }) => (
                    <div key={nodeId} className="variable-group">
                      <div className="variable-node-title">
                        <strong>{nodeId}</strong> ({nodeType})
                      </div>
                      <div className="variable-items">
                        {variables.map(variable => (
                          <button
                            key={variable}
                            className="variable-item"
                            onClick={() => insertVariable(nodeId, variable)}
                          >
                            {`{{${nodeId}.${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="variable-hint">
                💡 Tip: Click vào variable để chèn vào field đang chọn
              </div>
            </div>
          )}
          
          {renderForm()}
        </div>

        <div className="config-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  )
}
