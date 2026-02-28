# GameLauncher 開發指南

## 🚀 快速開始

### 環境需求
- .NET 8.0 SDK
- Visual Studio 2022 或 VS Code
- Node.js (用於測試伺服器)

### 專案結構

```
GameLauncher/
├── GameLauncher/               # 主程式 (Windows Forms UI)
│   ├── Forms/
│   │   ├── LoginForm.cs        # 登入介面
│   │   ├── MainForm.cs         # 主視窗
│   │   └── SettingsForm.cs     # 設定介面
│   ├── Program.cs              # 程式入口
│   └── GameLauncher.csproj
├── GameLauncher.Core/          # 核心邏輯 (獨立類別庫)
│   ├── Auth/
│   │   └── LoginManager.cs     # 登入管理
│   ├── Version/
│   │   └── VersionChecker.cs   # 版本驗證
│   └── Config/
│       └── AppConfig.cs        # 設定管理
├── GameLauncher.Network/       # 網路層 (獨立類別庫)
│   ├── Http/
│   │   └── ApiClient.cs        # HTTP API 客戶端
│   └── Models/
│       └── LoginModels.cs      # 資料模型
├── test-server.js              # Node.js 測試伺服器
└── GameLauncher.sln            # Visual Studio 方案檔
```

## 📝 功能說明

### 1. 登入功能
- 帳號密碼驗證
- SHA256 密碼雜湊
- 記住帳號功能
- 裝置識別碼

### 2. 版本驗證
- 啟動時自動檢查版本
- 強制更新機制
- 可選更新提示
- 版本號比較

### 3. 設定管理
- JSON 設定檔儲存
- API 位址設定
- 遊戲路徑設定
- 啟動器行為設定

## 🔧 編譯與執行

### 使用命令列

```bash
# 還原 NuGet 套件
dotnet restore GameLauncher.sln

# 編譯
dotnet build GameLauncher.sln

# 執行
dotnet run --project GameLauncher/GameLauncher.csproj
```

### 使用 Visual Studio

1. 開啟 `GameLauncher.sln`
2. 設定啟動專案為 `GameLauncher`
3. 按 F5 執行

## 🧪 測試

### 啟動測試伺服器

```bash
node test-server.js
```

伺服器將運行於 `http://localhost:3000`

### 測試帳號
- 帳號: `test`
- 密碼: `password` (前端會自動雜湊)

### API 端點

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/version?current=1.0.0` | 檢查版本 |
| POST | `/api/auth/login` | 登入 |
| GET | `/api/auth/validate` | 驗證 Token |

### 登入請求範例

```json
{
  "username": "test",
  "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "clientVersion": "1.0.0",
  "deviceId": "abc123"
}
```

## 🎨 參考 Launcher_V2 的設計

### 架構對照

| Launcher_V2 | 本專案 | 用途 |
|------------|--------|------|
| `KartriderLibrary/Network/` | `GameLauncher.Network/` | 網路通訊 |
| `KartRider.Data/Forms/` | `GameLauncher/Forms/` | UI 表單 |
| `GameSupport.cs` | `LoginManager.cs` | 登入邏輯 |
| `PatchUpdate.cs` | `VersionChecker.cs` | 版本驗證 |

### 技術差異

本專案為學習用途簡化了以下部分：
- 不使用真實遊戲記憶體修改
- 不使用封包攔截/修改
- 使用標準 HTTP 而非自訂協議
- 簡化的加密實作

## 📚 學習重點

### 1. 分層架構
- UI 層 (Forms)
- 核心邏輯層 (Core)
- 網路層 (Network)

### 2. 非同步程式設計
```csharp
private async void BtnLogin_Click(object sender, EventArgs e)
{
    var result = await _loginManager.LoginAsync(username, password);
    // 處理結果
}
```

### 3. 設定持久化
- 使用 JSON 儲存設定
- 儲存在 `AppData` 資料夾

### 4. 安全考量
- 密碼雜湊 (SHA256)
- Token 機制
- 裝置識別

## 🔒 生產環境注意事項

如果要用於實際專案，需要加強：

1. **加密**: 使用 HTTPS、更強的密碼雜湊 (bcrypt/Argon2)
2. **Token**: 使用 JWT、設定過期時間
3. **驗證**: 加入 CAPTCHA、防止暴力破解
4. **日誌**: 記錄登入行為
5. **更新**: 實作自動下載與安裝更新

## 📖 延伸閱讀

- [.NET Windows Forms 文件](https://docs.microsoft.com/dotnet/desktop/winforms/)
- [HttpClient 最佳實踐](https://docs.microsoft.com/dotnet/fundamentals/networking/http/httpclient-guidelines)
- [非同步程式設計](https://docs.microsoft.com/dotnet/csharp/async)
