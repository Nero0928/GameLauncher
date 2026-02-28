# GameLauncher 技術學習專案

一個基於 C# Windows Forms 的遊戲登入器範例，展示登入驗證與版本檢查機制。

## 專案結構

```
GameLauncher/
├── GameLauncher/               # 主程式 (Windows Forms)
│   ├── Forms/
│   │   ├── LoginForm.cs        # 登入表單
│   │   ├── MainForm.cs         # 主視窗
│   │   └── SettingsForm.cs     # 設定介面
│   ├── Program.cs
│   └── GameLauncher.csproj
├── GameLauncher.Core/          # 核心邏輯
│   ├── Models/
│   │   └── LoginModels.cs      # 資料模型
│   ├── Services/
│   │   └── ApiClient.cs        # HTTP API 客戶端
│   ├── Auth/
│   │   └── LoginManager.cs     # 登入管理
│   ├── Version/
│   │   └── VersionChecker.cs   # 版本驗證
│   └── Config/
│       └── AppConfig.cs        # 設定管理
├── server/                     # 後端伺服器 (Node.js + Express + SQLite)
│   ├── routes/
│   │   ├── auth.js             # 認證路由
│   │   └── version.js          # 版本路由
│   ├── database.js             # 資料庫管理
│   ├── index.js                # 伺服器入口
│   ├── package.json
│   └── README.md
├── test-server.js              # 簡易測試伺服器 (舊版)
└── GameLauncher.sln            # Visual Studio 方案檔
```

## 功能特性

- ✅ 帳號密碼登入
- ✅ 版本驗證與更新提示
- ✅ 自動登入 (記住帳號)
- ✅ 安全的密碼儲存
- ✅ 模組化架構
- ✅ 完整後端 API
- ✅ SQLite 資料庫
- ✅ JWT 認證

## 快速開始

### 1. 啟動後端伺服器

```bash
cd server
npm install
cp .env.example .env
npm start
```

伺服器運行於 `http://localhost:3000`

### 2. 執行登入器

```bash
# 還原套件
dotnet restore

# 編譯
dotnet build

# 執行
dotnet run --project GameLauncher/GameLauncher.csproj
```

### 測試帳號

- 帳號: `admin`
- 密碼: `admin123`

## API 文件

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊 |
| POST | `/api/auth/login` | 登入 |
| GET | `/api/auth/validate` | 驗證 Token |
| GET | `/api/version?current=1.0.0` | 檢查版本 |

詳見 [server/README.md](server/README.md)

## 開發指南

詳見 [DEVELOPMENT.md](DEVELOPMENT.md)

## GitHub

https://github.com/Nero0928/GameLauncher
