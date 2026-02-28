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
├── test-server.js              # Node.js 測試伺服器
└── GameLauncher.sln            # Visual Studio 方案檔
```

## 功能特性

- ✅ 帳號密碼登入
- ✅ 版本驗證與更新提示
- ✅ 自動登入 (記住帳號)
- ✅ 安全的密碼儲存
- ✅ 模組化架構

## 快速開始

### 環境需求
- .NET 8.0 SDK
- Visual Studio 2022 或 VS Code
- Node.js (選用，用於測試伺服器)

### 編譯與執行

```bash
# 還原套件
dotnet restore

# 編譯
dotnet build

# 執行
dotnet run --project GameLauncher/GameLauncher.csproj
```

### 測試伺服器

```bash
node test-server.js
```

測試帳號：`test` / `password`

## 技術參考

參考 Launcher_V2 的架構設計，簡化為學習用途。

## 開發指南

詳見 [DEVELOPMENT.md](DEVELOPMENT.md)

## GitHub

https://github.com/Nero0928/GameLauncher
