import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './CustomNode.css';

export const HttpRequestNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node http-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔗</span>
        <span className="node-title">HTTP Request</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Method:</strong> {data.method || 'GET'}
        </div>
        <div className="node-field">
          <strong>URL:</strong> {data.url || 'Chưa cấu hình'}
        </div>
        {data.headers && (
          <div className="node-field">
            <strong>Headers:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const DatabaseNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node database-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🗄️</span>
        <span className="node-title">Database</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Loại:</strong> {data.operation || 'Query'}
        </div>
        <div className="node-field">
          <strong>Table:</strong> {data.table || 'Chưa cấu hình'}
        </div>
        {data.query && (
          <div className="node-field">
            <strong>Query:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const EmailNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node email-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">📧</span>
        <span className="node-title">Gửi Email</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Đến:</strong> {data.to || 'Chưa cấu hình'}
        </div>
        <div className="node-field">
          <strong>Tiêu đề:</strong> {data.subject || 'Chưa có'}
        </div>
        {data.body && (
          <div className="node-field">
            <strong>Nội dung:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const DelayNode = memo(({ data, selected }: NodeProps) => {
  const duration = data.duration || '0';
  const unit = data.unit || 'giây';
  const displayText = duration === '0' ? 'Chưa cấu hình' : `${duration} ${unit}`;
  
  return (
    <div className={`custom-node delay-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">⏱️</span>
        <span className="node-title">Trì hoãn</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Thời gian:</strong> {displayText}
        </div>
        {data.note && (
          <div className="node-field">
            <strong>Ghi chú:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const ConditionalNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node conditional-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">◆</span>
        <span className="node-title">Điều kiện</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Nếu:</strong> {data.condition || 'Chưa cấu hình'}
        </div>
        {data.operator && (
          <div className="node-field">
            <strong>Toán tử:</strong> {data.operator}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Left} id="true" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} />
    </div>
  );
});

HttpRequestNode.displayName = 'HttpRequestNode';
DatabaseNode.displayName = 'DatabaseNode';
EmailNode.displayName = 'EmailNode';
DelayNode.displayName = 'DelayNode';
ConditionalNode.displayName = 'ConditionalNode';

export const TelegramNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node telegram-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">💬</span>
        <span className="node-title">Telegram</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Chat ID:</strong> {data.chatId || 'Từ webhook'}
        </div>
        <div className="node-field">
          <strong>Tin nhắn:</strong> {data.text ? '✓' : 'Chưa cấu hình'}
        </div>
        {data.parseMode && (
          <div className="node-field">
            <strong>Format:</strong> {data.parseMode}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const ChatGPTNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node chatgpt-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🧠</span>
        <span className="node-title">ChatGPT</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Model:</strong> {data.model || 'gpt-3.5-turbo'}
        </div>
        <div className="node-field">
          <strong>Prompt:</strong> {data.userMessage ? '✓' : 'Chưa cấu hình'}
        </div>
        {data.systemPrompt && (
          <div className="node-field">
            <strong>System:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const GeminiNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node gemini-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">💎</span>
        <span className="node-title">Gemini AI</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Model:</strong> {data.model || 'gemini-pro'}
        </div>
        <div className="node-field">
          <strong>Prompt:</strong> {data.userMessage ? '✓' : 'Chưa cấu hình'}
        </div>
        {data.systemPrompt && (
          <div className="node-field">
            <strong>System:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const ContentFilterNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node filter-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔍</span>
        <span className="node-title">Lọc Nội Dung</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Kiểm tra:</strong> {data.inputText || 'Tin nhắn'}
        </div>
        <div className="node-field">
          <strong>Từ khóa:</strong> {data.keywords?.length || 0} từ
        </div>
        {data.rejectionMessage && (
          <div className="node-field">
            <strong>Cảnh báo:</strong> ✓
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Left} id="pass" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Right} id="reject" style={{ top: '70%' }} />
    </div>
  );
});

export const GoogleSheetsNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`custom-node sheets-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">📊</span>
        <span className="node-title">Google Sheets</span>
      </div>
      <div className="node-body">
        <div className="node-field">
          <strong>Action:</strong> {data.action || 'READ'}
        </div>
        {data.sheetName && (
          <div className="node-field">
            <strong>Sheet:</strong> {data.sheetName}
          </div>
        )}
        {data.range && (
          <div className="node-field">
            <strong>Range:</strong> {data.range}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

TelegramNode.displayName = 'TelegramNode';
ChatGPTNode.displayName = 'ChatGPTNode';
ContentFilterNode.displayName = 'ContentFilterNode';
GoogleSheetsNode.displayName = 'GoogleSheetsNode';
