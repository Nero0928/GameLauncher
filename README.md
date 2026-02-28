# GameLauncher 技術學習專案

一個基於 C# Windows Forms 的遊戲登入器範例，展示登入驗證與版本檢查機制。

## 專案結構

```
GameLauncher/
├── GameLauncher/               # 主程式 (UI)
│   ├── Forms/
│   │   ├── MainForm.cs         # 主視窗
│   │   └── LoginForm.cs        # 登入表單
│   ├── Program.cs
│   └── GameLauncher.csproj
├── GameLauncher.Core/          # 核心邏輯
│   ├── Auth/
│   │   ├── LoginManager.cs     # 登入管理
│   │   └── SessionManager.cs   # 會話管理
│   ├── Version/
│   │   └── VersionChecker.cs   # 版本驗證
│   └── Config/
│       └── AppConfig.cs        # 設定管理
└── GameLauncher.Network/       # 網路層
    ├── Http/
    │   └── ApiClient.cs        # HTTP API 客戶端
    └── Models/
        ├── LoginRequest.cs
        ├── LoginResponse.cs
        └── VersionInfo.cs
```

## 功能特性

- ✅ 帳號密碼登入
- ✅ 版本驗證與更新提示
- ✅ 自動登入 (記住帳號)
- ✅ 安全的密碼儲存
- ✅ 模組化架構

## 技術參考

參考 Launcher_V2 的架構設計，簡化為學習用途。
