# GameLauncher 後端伺服器

基於 Node.js + Express + SQLite 的完整遊戲後端實作。

## 功能特性

### 核心功能
- ✅ RESTful API
- ✅ SQLite 資料庫
- ✅ 使用者註冊/登入
- ✅ JWT 認證
- ✅ 版本管理

### 遊戲功能
- ✅ **賽車系統** - 車輛資料、購買、庫存
- ✅ **賽道系統** - 賽道資料、隨機選擇
- ✅ **房間系統** - 建立、加入、離開房間
- ✅ **物品系統** - 道具購買、使用
- ✅ **好友系統** - 好友請求、列表
- ✅ **賽事系統** - 限時活動、排行榜
- ✅ **遊戲記錄** - 比賽記錄、最佳成績

## 快速開始

### 1. 安裝相依套件

```bash
cd server
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`：
```env
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. 啟動伺服器

```bash
# 開發模式 (自動重啟)
npm run dev

# 生產模式
npm start
```

伺服器運行於 `http://localhost:3000`

## API 文件

### 🔐 認證

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 使用者註冊 |
| POST | `/api/auth/login` | 使用者登入 |
| GET | `/api/auth/validate` | 驗證 Token |
| GET | `/api/auth/profile` | 取得使用者資料 |

### 🏎️ 賽車

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/karts` | 取得所有賽車 |
| GET | `/api/karts/:kartId` | 取得賽車詳細資訊 |
| GET | `/api/karts/user/:userId` | 取得使用者的賽車 |
| POST | `/api/karts/buy` | 購買賽車 |

### 🏁 賽道

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/tracks` | 取得所有賽道 |
| GET | `/api/tracks/:trackId` | 取得賽道詳細資訊 |
| GET | `/api/tracks/random/:difficulty` | 隨機選擇賽道 |

### 🎮 房間

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/rooms` | 取得房間列表 |
| GET | `/api/rooms/:roomId` | 取得房間詳細資訊 |
| POST | `/api/rooms/create` | 建立房間 |
| POST | `/api/rooms/join` | 加入房間 |
| POST | `/api/rooms/leave` | 離開房間 |

### 📦 物品

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/items` | 取得所有物品 |
| GET | `/api/items/user/:userId` | 取得使用者的物品 |
| POST | `/api/items/buy` | 購買物品 |
| POST | `/api/items/use` | 使用物品 |

### 👥 好友

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/friends/:userId` | 取得好友列表 |
| POST | `/api/friends/request` | 發送好友請求 |
| POST | `/api/friends/accept` | 接受好友請求 |
| POST | `/api/friends/remove` | 刪除好友 |

### 🏆 賽事

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/events` | 取得進行中的賽事 |
| GET | `/api/events/:eventId` | 取得賽事詳細資訊 |
| GET | `/api/events/:eventId/leaderboard` | 取得賽事排行榜 |
| POST | `/api/events/create` | 建立賽事 (管理員) |

### 📊 遊戲記錄

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/records/user/:userId` | 取得使用者的記錄 |
| GET | `/api/records/track/:trackId/best` | 取得賽道最佳記錄 |
| POST | `/api/records` | 新增遊戲記錄 |

### 🔧 版本

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/version?current=1.0.0` | 檢查版本 |
| GET | `/api/version/latest` | 取得最新版本 |

## 資料庫結構

### 表格清單

1. **users** - 使用者資料
2. **karts** - 賽車資料
3. **user_karts** - 使用者賽車庫存
4. **tracks** - 賽道資料
5. **game_records** - 遊戲記錄
6. **rooms** - 房間資料
7. **room_players** - 房間玩家
8. **items** - 物品資料
9. **user_items** - 使用者物品庫存
10. **friends** - 好友關係
11. **events** - 賽事活動
12. **versions** - 版本資訊

詳細結構請見 `database.js`

## 測試帳號

- 帳號: `admin`
- 密碼: `admin123`

## 預設資料

伺服器啟動時會自動建立：
- 管理員帳號
- 4 輛預設賽車
- 5 條預設賽道
- 4 種預設物品
- 版本資訊
