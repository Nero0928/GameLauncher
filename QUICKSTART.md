# 🚀 快速啟動指南

## 本地開發測試 (3步驟)

### 步驟 1: 啟動後端伺服器

**Windows:**
```bash
start-server.bat
```

**macOS/Linux:**
```bash
./start-server.sh
```

或手動：
```bash
cd server
npm install
npm run dev
```

成功後會看到：
```
🚀 伺服器運行於 http://localhost:3000
✅ 資料庫初始化完成
預設帳號: admin / admin123
```

---

### 步驟 2: 啟動登入器

開啟 **新終端機** (保持後端運行)：

```bash
cd GameLauncher

# 還原套件 (第一次需要)
dotnet restore

# 編譯並執行
dotnet run --project GameLauncher/GameLauncher.csproj
```

或直接用 VS Code 按 **F5**

---

### 步驟 3: 登入測試

登入表單輸入：
- 帳號: `admin`
- 密碼: `admin123`

---

## 📂 檔案說明

| 檔案 | 用途 |
|------|------|
| `start-server.bat` | Windows 一鍵啟動腳本 |
| `start-server.sh` | macOS/Linux 一鍵啟動腳本 |
| `server/.env.local` | 本地開發環境設定 |
| `server/.env.production` | 生產環境設定範本 |
| `DEPLOYMENT.md` | 完整部署指南 |

---

## 🔧 常用指令

### 後端

```bash
cd server

# 開發模式 (自動重啟)
npm run dev

# 生產模式
npm start

# 查看已安裝套件
npm list
```

### 登入器

```bash
# 還原套件
dotnet restore

# 編譯
dotnet build

# 執行
dotnet run --project GameLauncher/GameLauncher.csproj

# 發布單一檔案
dotnet publish -c Release -r win-x64 --self-contained true
```

---

## 🌐 API 測試

伺服器啟動後，可以測試 API：

```bash
# 健康檢查
curl http://localhost:3000/health

# 取得賽車列表
curl http://localhost:3000/api/karts

# 取得賽道列表
curl http://localhost:3000/api/tracks
```

或在瀏覽器開啟：
- http://localhost:3000/health
- http://localhost:3000/api/karts

---

## 📡 網路設定預留

### 本地開發 (現在)
- 後端: `http://localhost:3000`
- 登入器: 連線到 localhost

### 未來部署 (準備中)
- 設定檔已預留 `.env.production`
- 支援反向代理 (Nginx)
- 支援 SSL/TLS
- 詳見 `DEPLOYMENT.md`

---

## ❓ 問題排除

### "無法連線到後端"
1. 確認後端已啟動 (`http://localhost:3000/health`)
2. 檢查 Windows 防火牆
3. 確認登入器的 `ApiBaseUrl` 設定

### "npm install 失敗"
1. 確認 Node.js 已安裝: `node --version`
2. 清除快取: `npm cache clean --force`
3. 使用管理員權限執行

### "dotnet 指令找不到"
1. 安裝 .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0
2. 重開終端機

---

準備好了就開始測試吧！🎮
