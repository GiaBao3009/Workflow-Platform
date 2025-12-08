# ⚠️ LƯU Ý: FOLDER NÀO ĐANG DÙNG?

## ✅ ĐANG SỬ DỤNG:

### `apps/frontend/` - App chính (User + Admin)
- **Port**: `localhost:5174`
- **Chức năng**:
  - User: Tạo và quản lý workflow (route `/`)
  - Admin: Dashboard quản trị (route `/admin`)
- **Files quan trọng**:
  - `src/pages/AdminDashboard.tsx` - Trang admin
  - `src/components/Header.tsx` - Header với nút "⚙️ Quản Trị"
  - `src/App.tsx` - Routes (`/` và `/admin`)

### `apps/backend-api/` - Backend API
- **Port**: `localhost:3001`
- **Endpoints mới**:
  - `GET /api/admin/dashboard` - Stats cho admin
  - `GET /api/users` - Danh sách users
  - `GET /api/executions` - Danh sách executions

## ❌ KHÔNG DÙNG NỮA:

### `apps/admin/` - Admin panel riêng (CŨ)
- **Lý do bỏ**: Admin đã tích hợp vào `apps/frontend`
- **Có thể xóa**: Đóng VS Code và xóa thủ công folder này

## 🚀 Cách Chạy:

```bash
# 1. Install dependencies (lần đầu)
cd apps/frontend
npm install

# 2. Start backend
cd apps/backend-api
npm run dev

# 3. Start frontend (terminal mới)
cd apps/frontend
npm run dev

# 4. Truy cập
# - User app: http://localhost:5174
# - Admin: http://localhost:5174/admin (nếu role="admin")
```

## 🔐 Set Admin Role:

Vào MongoDB Compass hoặc mongosh:

```javascript
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "admin" } }
)
```

Sau đó refresh page sẽ thấy nút "⚙️ Quản Trị" ở Header!

## 📝 Tóm Tắt:

- ✅ **1 app duy nhất**: `apps/frontend` (port 5174)
- ✅ **2 routes**: `/` (user) và `/admin` (admin)
- ✅ **1 backend**: `apps/backend-api` (port 3001)
- ✅ **100% Tiếng Việt**
- ✅ **Logo chính** của app (không logo riêng)
- ✅ **Data thật** từ MongoDB
