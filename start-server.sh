#!/bin/bash

echo "🎮 GameLauncher 本地開發啟動腳本"
echo "================================="
echo ""

# 檢查 Node.js
echo "[1/4] 檢查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 找不到 Node.js，請先安裝 https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 已安裝 ($(node --version))"

# 進入 server 目錄
cd "$(dirname "$0")/server" || exit 1

# 檢查 npm 套件
echo ""
echo "[2/4] 檢查後端相依套件..."
if [ ! -d "node_modules" ]; then
    echo "📦 安裝 npm 套件..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm 安裝失敗"
        exit 1
    fi
else
    echo "✅ 套件已安裝"
fi

# 設定環境變數
echo ""
echo "[3/4] 設定環境..."
if [ ! -f ".env" ]; then
    echo "📝 複製本地開發設定..."
    cp .env.local .env
fi

# 啟動伺服器
echo ""
echo "[4/4] 啟動後端伺服器..."
echo ""
echo "🚀 伺服器啟動中，請稍候..."
echo "   API 位址: http://localhost:3000"
echo "   按 Ctrl+C 停止伺服器"
echo ""

npm run dev
