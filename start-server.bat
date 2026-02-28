@echo off
chcp 65001 > nul
echo 🎮 GameLauncher 本地開發啟動腳本
echo =================================
echo.

:: 檢查 Node.js
echo [1/4] 檢查 Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ 找不到 Node.js，請先安裝 https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安裝

:: 檢查 npm 套件
echo.
echo [2/4] 檢查後端相依套件...
cd server
if not exist "node_modules" (
    echo 📦 安裝 npm 套件...
    call npm install
    if errorlevel 1 (
        echo ❌ npm 安裝失敗
        pause
        exit /b 1
    )
) else (
    echo ✅ 套件已安裝
)

:: 設定環境變數
echo.
echo [3/4] 設定環境...
if not exist ".env" (
    echo 📝 複製本地開發設定...
    copy .env.local .env > nul
)

:: 啟動伺服器
echo.
echo [4/4] 啟動後端伺服器...
echo.
echo 🚀 伺服器啟動中，請稍候...
echo    API 位址: http://localhost:3000
echo    按 Ctrl+C 停止伺服器
echo.

npm run dev

pause
