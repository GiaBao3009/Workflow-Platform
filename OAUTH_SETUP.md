# OAuth Setup Guide

Hướng dẫn cấu hình Google OAuth và GitHub OAuth cho Workflow Platform.

## 📋 Tổng quan

OAuth cho phép người dùng đăng nhập vào platform bằng tài khoản Google hoặc GitHub mà không cần tạo tài khoản riêng. Hệ thống sử dụng JWT tokens để quản lý sessions.

## 🔧 Kiến trúc

- **Backend**: Passport.js với Google OAuth 2.0 và GitHub OAuth strategies
- **Frontend**: React với Zustand store quản lý auth state
- **Storage**: JWT tokens lưu trong localStorage, user data trong MongoDB
- **Flow**: OAuth redirect → Backend callback → JWT token → Frontend redirect với token

---

## 🌐 Google OAuth Setup

### Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable **Google+ API**

### Bước 2: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Chọn **Application type**: Web application
4. Điền thông tin:
   - **Name**: Workflow Platform (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3001
     http://localhost:5174
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3001/api/auth/google/callback
     ```

### Bước 3: Copy credentials

1. Sau khi tạo, copy **Client ID** và **Client Secret**
2. Mở file `.env` trong project root
3. Cập nhật:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   ```

---

## 🐙 GitHub OAuth Setup

### Bước 1: Tạo GitHub OAuth App

1. Truy cập [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Điền thông tin:
   - **Application name**: Workflow Platform
   - **Homepage URL**: `http://localhost:5174`
   - **Authorization callback URL**: 
     ```
     http://localhost:3001/api/auth/github/callback
     ```

### Bước 2: Copy credentials

1. Sau khi tạo, copy **Client ID**
2. Click **Generate a new client secret** và copy secret
3. Mở file `.env` và cập nhật:
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
   ```

---

## ⚙️ Cấu hình Frontend

File `.env` đã có sẵn, nhưng nếu cần thay đổi port:

```env
FRONTEND_URL=http://localhost:5174
```

---

## 🚀 Chạy ứng dụng

### 1. Khởi động Backend

```bash
cd apps/backend-api
npm start
```

Backend sẽ chạy trên `http://localhost:3001`

### 2. Khởi động Worker (Temporal)

```bash
cd hello-temporal
npm run dev
```

### 3. Khởi động Frontend

```bash
cd apps/frontend
npm run dev
```

Frontend sẽ chạy trên `http://localhost:5174`

---

## 🧪 Test OAuth Flow

### Google Login:
1. Mở `http://localhost:5174`
2. Click **🔐 Đăng Nhập**
3. Click nút **Google** trong modal
4. Chọn tài khoản Google
5. Sau khi authorize, bạn sẽ được redirect về frontend với token
6. User profile hiển thị ở header

### GitHub Login:
1. Click **🔐 Đăng Nhập**
2. Click nút **GitHub** trong modal
3. Authorize application
4. Redirect về frontend với token

---

## 🔐 JWT Token Management

### Token Storage
- Token được lưu trong `localStorage` với key `auth_token`
- Tự động gửi trong header: `Authorization: Bearer <token>`

### Token Expiration
- Default: 7 ngày (cấu hình trong `.env`: `JWT_EXPIRES_IN=7d`)
- Có thể đổi thành: `1h`, `24h`, `30d`, etc.

### Logout
- Client xóa token từ localStorage
- Server endpoint `/api/auth/logout` (optional - với JWT không cần invalidate)

---

## 📊 Database Schema

User được lưu trong MongoDB với schema:

```typescript
{
  _id: ObjectId,
  email: string,
  name?: string,
  avatar?: string,
  googleId?: string,     // Từ Google OAuth
  githubId?: string,     // Từ GitHub OAuth
  provider: 'google' | 'github' | 'local',
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 OAuth Flow Diagram

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│ Client  │─────>│ Backend │─────>│  Google/ │─────>│ Backend  │
│         │      │ /auth/  │      │  GitHub  │      │ callback │
│         │      │ google  │      │          │      │          │
└─────────┘      └─────────┘      └──────────┘      └──────────┘
                                                            │
                                                            v
                                                    ┌──────────────┐
                                                    │ Create/Find  │
                                                    │ User in DB   │
                                                    └──────────────┘
                                                            │
                                                            v
                                                    ┌──────────────┐
                                                    │ Generate JWT │
                                                    │ Token        │
                                                    └──────────────┘
                                                            │
                                                            v
┌─────────┐                                         ┌──────────────┐
│ Client  │<────────────────────────────────────────│ Redirect to  │
│ Store   │  http://localhost:5174?token=xxx        │ Frontend     │
│ Token   │                                         └──────────────┘
└─────────┘
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Kiểm tra callback URL trong Google/GitHub app settings khớp với `.env`
- Đảm bảo không có trailing slash: ❌ `.../callback/` ✅ `.../callback`

### Error: "User not found"
- Check MongoDB connection trong backend logs
- Verify user collection có được tạo

### Token không lưu
- Check browser console for localStorage errors
- Verify frontend đang chạy đúng port (5174)

### CORS errors
- Backend đã config CORS cho `*` (all origins)
- Nếu cần giới hạn, update trong `apps/backend-api/src/index.ts`

---

## 🔒 Production Setup

Khi deploy production, cập nhật:

### 1. Environment Variables
```env
# Production URLs
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback

# Secure JWT Secret
JWT_SECRET=use-a-strong-random-secret-here
JWT_EXPIRES_IN=7d
```

### 2. OAuth Apps Configuration
- Update redirect URIs trong Google Cloud Console
- Update callback URL trong GitHub OAuth App settings

### 3. Security
- Enable HTTPS
- Set secure cookie flags
- Implement rate limiting on auth endpoints
- Add CSRF protection

---

## 📚 API Endpoints

### Auth Routes (Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Initiate Google OAuth |
| `/api/auth/google/callback` | GET | Google OAuth callback |
| `/api/auth/github` | GET | Initiate GitHub OAuth |
| `/api/auth/github/callback` | GET | GitHub OAuth callback |
| `/api/auth/me` | GET | Get current user (requires token) |
| `/api/auth/logout` | POST | Logout (clear token) |

### Example: Get Current User

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/auth/me
```

Response:
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "provider": "google"
  }
}
```

---

## ✅ Checklist

- [ ] Google OAuth App tạo xong
- [ ] GitHub OAuth App tạo xong
- [ ] `.env` đã cập nhật credentials
- [ ] MongoDB đang chạy
- [ ] Backend started (`npm start`)
- [ ] Worker started (`npm run dev`)
- [ ] Frontend started (`npm run dev`)
- [ ] Test Google login thành công
- [ ] Test GitHub login thành công
- [ ] User profile hiển thị ở header

---

## 🎉 Hoàn thành!

Giờ bạn đã có OAuth authentication hoàn chỉnh với Google và GitHub!

Nếu gặp vấn đề, check logs:
- Backend: Console output từ `apps/backend-api`
- Frontend: Browser DevTools Console
- MongoDB: MongoDB Atlas Dashboard
