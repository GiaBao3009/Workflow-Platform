# 🎨 Custom Nodes & Drag & Drop - Hướng Dẫn

## ✅ Đã Hoàn Thành

### 1. **5 Loại Custom Node**

Đã tạo 5 loại node tùy chỉnh với giao diện tiếng Việt:

#### 🌐 HTTP Request Node
- Hiển thị: Method (GET/POST/PUT/DELETE), URL
- Màu: Xanh dương (#3b82f6)
- Dùng để: Gọi API, webhook, lấy dữ liệu từ web

#### 💾 Database Node
- Hiển thị: Loại thao tác (Query/Insert/Update), Tên table
- Màu: Xanh lá (#10b981)
- Dùng để: Truy vấn database, lưu/đọc dữ liệu

#### 📧 Email Node
- Hiển thị: Người nhận, Tiêu đề email
- Màu: Cam (#f59e0b)
- Dùng để: Gửi email tự động, thông báo

#### ⏰ Delay Node
- Hiển thị: Thời gian trì hoãn (giây/phút/giờ)
- Màu: Tím (#8b5cf6)
- Dùng để: Tạm dừng workflow, chờ đợi

#### 🔀 Conditional Node
- Hiển thị: Điều kiện kiểm tra
- Màu: Đỏ (#ef4444)
- 2 output: True (trái), False (phải)
- Dùng để: Rẽ nhánh logic, kiểm tra điều kiện

---

### 2. **Drag & Drop Functionality**

✅ **Kéo thả từ Palette → Canvas**
- Palette ở đầu trang hiển thị 5 loại node
- Kéo bất kỳ node nào vào canvas
- Node tự động xuất hiện tại vị trí thả
- Cursor thay đổi: `grab` → `grabbing`

✅ **Tính năng đã implement:**
- `onDragStart`: Bắt đầu kéo node từ palette
- `onDragOver`: Cho phép thả vào canvas
- `onDrop`: Tạo node mới tại vị trí thả
- Auto-generate ID: `{nodeType}-{timestamp}`

---

### 3. **React Flow Integration**

✅ **Node Types đã đăng ký:**
```typescript
const nodeTypes = {
  httpRequest: HttpRequestNode,
  database: DatabaseNode,
  email: EmailNode,
  delay: DelayNode,
  conditional: ConditionalNode,
}
```

✅ **Features:**
- Connect nodes: Kéo từ handle này sang handle khác
- Select node: Click để chọn (viền highlight)
- Move node: Kéo node đi chuyển vị trí
- Delete node: Select + Delete key
- Zoom & Pan: Scroll để zoom, kéo canvas để pan
- MiniMap: Bản đồ thu nhỏ ở góc
- Controls: Zoom +/-, fit view, lock

---

## 🎯 Cách Sử Dụng

### Bước 1: Mở ứng dụng
```bash
http://localhost:3000
```

### Bước 2: Tạo workflow mới
1. Click "➕ Tạo Workflow Mới" ở Sidebar
2. Workflow mới sẽ hiển thị trên canvas

### Bước 3: Kéo thả node
1. Tìm node cần dùng trong palette (đầu trang)
2. Kéo node vào canvas
3. Thả tại vị trí mong muốn

### Bước 4: Kết nối các node
1. Hover vào node → thấy các handle (chấm tròn)
2. Kéo từ handle dưới (output) → handle trên (input) của node khác
3. Edge (đường nối) tự động tạo

### Bước 5: Lưu workflow
1. Click "💾 Lưu" để lưu cấu trúc
2. Workflow được lưu vào backend (in-memory)

---

## 📁 Files Đã Tạo/Chỉnh Sửa

### Mới tạo:
1. **`apps/frontend/src/components/nodes/CustomNodes.tsx`**
   - 5 React components cho custom nodes
   - TypeScript interfaces
   - React.memo cho performance

2. **`apps/frontend/src/components/nodes/CustomNode.css`**
   - Styling cho từng loại node
   - Hover, selected states
   - Color coding theo node type

### Đã cập nhật:
1. **`apps/frontend/src/components/WorkflowCanvas.tsx`**
   - Import custom nodes
   - Drag & drop handlers
   - Register nodeTypes với ReactFlow
   - onDrop, onDragOver, onDragStart

2. **`apps/frontend/src/components/WorkflowCanvas.css`**
   - Palette styling
   - Cursor grab/grabbing
   - Hover animations

---

## 🚀 Tiếp Theo Cần Làm

### 1. **Node Configuration Panel** 🔧
Khi click vào node → hiển thị panel để cấu hình:
- HTTP Node: nhập URL, method, headers, body
- Database Node: chọn operation, table, query
- Email Node: nhập to, subject, body template
- Delay Node: nhập duration, chọn unit
- Conditional Node: nhập condition expression

### 2. **Save Node Data** 💾
Lưu cấu hình của từng node vào:
```typescript
node.data = {
  url: 'https://api.example.com',
  method: 'POST',
  headers: {...},
  // ...
}
```

### 3. **Workflow Execution** ▶️
Khi click "Chạy Thử":
- Đọc toàn bộ nodes + edges
- Convert sang Temporal workflow
- Execute qua Worker
- Hiển thị kết quả

### 4. **Execution History** 📊
- Danh sách các lần chạy
- Status: Running/Completed/Failed
- Duration, timestamp
- Logs, outputs

### 5. **Advanced Features** ✨
- Validation: Kiểm tra node config trước khi save
- Templates: Save/load workflow templates
- Variables: Sử dụng biến giữa các node
- Error handling: Retry, fallback logic

---

## 🧪 Testing

### Test Drag & Drop:
1. ✅ Kéo HTTP Request vào canvas
2. ✅ Kéo Database vào canvas
3. ✅ Kết nối HTTP → Database
4. ✅ Di chuyển nodes
5. ✅ Select/deselect nodes
6. ✅ Zoom in/out
7. ✅ Pan canvas

### Test Save:
1. ✅ Tạo workflow với nhiều nodes
2. ✅ Click "Lưu"
3. ✅ Reload trang → workflow vẫn còn

---

## 🎨 Customization

### Thêm node type mới:
1. Tạo component trong `CustomNodes.tsx`
2. Export component
3. Add vào `nodeTypes` object
4. Add vào palette trong `WorkflowCanvas.tsx`
5. Tạo CSS class trong `CustomNode.css`

### Thay đổi màu sắc:
Edit trong `CustomNode.css`:
```css
.http-node {
  border-color: #your-color;
}
```

### Thay đổi icon:
Edit trong `CustomNodes.tsx`:
```tsx
<span className="node-icon">🆕</span>
```

---

## 📝 Notes

- **Performance**: Sử dụng `React.memo` để tránh re-render không cần thiết
- **TypeScript**: Tất cả code đều type-safe
- **Vietnamese UI**: 100% giao diện tiếng Việt
- **Responsive**: CSS sử dụng CSS variables, dễ customize

---

## 🐛 Known Issues

- [ ] Node configuration panel chưa có
- [ ] Chưa validate node connections (có node chỉ nên connect với node nhất định)
- [ ] Chưa có undo/redo
- [ ] Chưa có keyboard shortcuts

---

## 👨‍💻 Developer Info

**Created**: Today
**Stack**: React + TypeScript + React Flow + Zustand
**Backend**: Express + In-memory storage
**Status**: ✅ Drag & Drop working, Configuration panel next
