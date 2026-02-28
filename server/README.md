# GameLauncher 後端伺服器

基於 Node.js + Express + SQLite 的完整後端實作。

## 功能特性

- ✅ RESTful API
- ✅ SQLite 資料庫
- ✅ 使用者註冊/登入
- ✅ JWT 認證
- ✅ 版本管理
- ✅ 密碼雜湊 (bcrypt)

## 快速開始

### 安裝相依套件

```bash
cd server
npm install
```

### 啟動伺服器

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

伺服器運行於 `http://localhost:3000`

## API 文件

### 認證相關

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 使用者註冊 |
| POST | `/api/auth/login` | 使用者登入 |
| GET | `/api/auth/validate` | 驗證 Token |
| GET | `/api/auth/profile` | 取得使用者資料 |

### 版本相關

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/version` | 檢查版本 |
| GET | `/api/version/latest` | 取得最新版本資訊 |

## 資料庫結構

### 使用者表 (users)
- id: INTEGER PRIMARY KEY
- username: TEXT UNIQUE
- password: TEXT (bcrypt 雜湊)
- nickname: TEXT
- email: TEXT
- created_at: DATETIME
- updated_at: DATETIME

### 版本表 (versions)
- id: INTEGER PRIMARY KEY
- version: TEXT
- minimum_version: TEXT
- download_url: TEXT
- release_notes: TEXT
- is_mandatory: BOOLEAN
- created_at: DATETIME

## 環境變數

建立 `.env` 檔案：

```env
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## 預設帳號

- 帳號: `admin`
- 密碼: `admin123`
