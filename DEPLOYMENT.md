# 部署指南

## 🖥️ 本地開發測試

### 環境需求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 後端伺服器 |
| .NET 8.0 SDK | 8.0+ | 登入器程式 |
| npm | 9+ | 套件管理 |

### 快速啟動 (本地開發)

#### 1. 啟動後端伺服器

```bash
cd server
npm install
npm run dev
```

- 本地 API: `http://localhost:3000`
- 自動重啟: 修改程式碼後自動重啟

#### 2. 啟動登入器 (新終端機)

```bash
# 還原套件
dotnet restore

# 執行 (開發模式)
dotnet run --project GameLauncher/GameLauncher.csproj

# 或編譯後執行
dotnet build
cd GameLauncher/bin/Debug/net8.0-windows
./GameLauncher.exe
```

#### 3. 測試帳號

- 帳號: `admin`
- 密碼: `admin123`

---

## 🌐 伺服器部署預留設定

### 網路基礎架構

```
┌─────────────────────────────────────────────────────────────┐
│                        網際網路                              │
│                   (你的域名/固定IP)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     路由器/防火牆                            │
│              端口轉發: 3000 → 伺服器內網IP                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    伺服器主機                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   後端伺服器     │  │   登入器客戶端   │                  │
│  │   Port: 3000    │  │   (玩家下載)    │                  │
│  │   或反向代理     │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 預留設定項目

#### 1. 端口設定

| 服務 | 開發端口 | 建議生產端口 | 說明 |
|------|----------|--------------|------|
| 後端 API | 3000 | 80/443 | HTTP/HTTPS |
| 後端 API (備用) | - | 3000 | 直接訪問或內網 |
| 資料庫 | - | 不對外 | SQLite 本地檔案 |

#### 2. 域名設定

```
# 建議域名結構
game.example.com      # 主網站/下載
api.game.example.com  # API 端點 (建議)
# 或
game.example.com/api  # API 子路徑
```

#### 3. 環境變數 (生產環境)

編輯 `server/.env.production`:

```env
# 伺服器設定
PORT=3000
NODE_ENV=production

# 安全設定 (部署前務必修改!)
JWT_SECRET=your-super-secret-random-key-here-change-immediately

# CORS 設定 (你的域名)
CORS_ORIGIN=https://game.example.com

# 資料庫路徑 (生產環境建議絕對路徑)
DB_PATH=/var/lib/gamelauncher/database.sqlite

# 日誌設定
LOG_LEVEL=info
LOG_FILE=/var/log/gamelauncher/server.log
```

#### 4. SSL/TLS 設定

使用 Let's Encrypt 免費證書:

```bash
# 安裝 certbot
sudo apt install certbot

# 取得證書
sudo certbot certonly --standalone -d api.game.example.com

# 證書路徑:
# /etc/letsencrypt/live/api.game.example.com/fullchain.pem
# /etc/letsencrypt/live/api.game.example.com/privkey.pem
```

#### 5. 反向代理 (Nginx)

```nginx
# /etc/nginx/sites-available/gamelauncher
server {
    listen 80;
    server_name api.game.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.game.example.com;

    ssl_certificate /etc/letsencrypt/live/api.game.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.game.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📦 生產部署腳本

### 自動部署腳本 (預留)

建立 `server/deploy.sh`:

```bash
#!/bin/bash
# 生產環境部署腳本

set -e

echo "🚀 開始部署 GameLauncher 伺服器..."

# 1. 更新程式碼
git pull origin master

# 2. 安裝相依套件
npm ci --production

# 3. 設定權限
chmod +x index.js

# 4. 備份資料庫
if [ -f database.sqlite ]; then
    cp database.sqlite "backups/database-$(date +%Y%m%d-%H%M%S).sqlite"
fi

# 5. 使用 PM2 啟動 (需預先安裝)
pm2 restart gamelauncher || pm2 start index.js --name gamelauncher

echo "✅ 部署完成!"
```

---

## 🔧 登入器配置調整

### 本地開發設定

編輯 `GameLauncher.Core/Config/AppConfig.cs`:

```csharp
// 開發環境
public string ApiBaseUrl { get; set; } = "http://localhost:3000";
```

### 生產環境設定 (預留)

建立配置切換機制:

```csharp
public static class AppEnvironment
{
    public static bool IsDevelopment => 
        Environment.GetEnvironmentVariable("GAME_ENV") == "development";
    
    public static string ApiBaseUrl => IsDevelopment 
        ? "http://localhost:3000" 
        : "https://api.game.example.com";
}
```

---

## 📋 檢查清單

### 本地測試檢查

- [ ] 後端伺服器啟動成功 (`http://localhost:3000/health`)
- [ ] 資料庫自動初始化完成
- [ ] 登入器能成功編譯
- [ ] 登入功能正常
- [ ] 版本檢查功能正常

### 生產部署檢查 (未來)

- [ ] 修改 JWT_SECRET
- [ ] 設定防火牆規則
- [ ] 設定反向代理 (Nginx)
- [ ] 設定 SSL 證書
- [ ] 設定自動備份
- [ ] 設定監控告警
- [ ] 更新登入器 API 位址

---

## 🆘 常見問題

### 本地測試問題

**Q: 後端顯示「端口被占用」?**
```bash
# 找出占用 3000 端口的程式
netstat -ano | findstr :3000
# 結束程式後重試
```

**Q: 登入器無法連線到後端?**
- 檢查 Windows 防火牆是否阻擋
- 檢查 `ApiBaseUrl` 是否為 `http://localhost:3000`

### 生產部署問題 (預留)

**Q: 如何更新伺服器?**
```bash
./deploy.sh
```

**Q: 如何查看日誌?**
```bash
pm2 logs gamelauncher
# 或
tail -f /var/log/gamelauncher/server.log
```
