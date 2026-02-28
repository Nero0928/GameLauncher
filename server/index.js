require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const versionRoutes = require('./routes/version');
const kartRoutes = require('./routes/karts');
const trackRoutes = require('./routes/tracks');
const recordRoutes = require('./routes/records');
const roomRoutes = require('./routes/rooms');
const itemRoutes = require('./routes/items');
const friendRoutes = require('./routes/friends');
const eventRoutes = require('./routes/events');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(cors());
app.use(express.json());

// 請求日誌
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/karts', kartRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/events', eventRoutes);

// 健康檢查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '伺服器內部錯誤' });
});

// 初始化資料庫並啟動伺服器
async function startServer() {
    try {
        await initDatabase();
        console.log('✅ 資料庫初始化完成');
        
        app.listen(PORT, () => {
            console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
            console.log('');
            console.log('📋 API 端點:');
            console.log('');
            console.log('🔐 認證:');
            console.log(`  POST http://localhost:${PORT}/api/auth/register`);
            console.log(`  POST http://localhost:${PORT}/api/auth/login`);
            console.log(`  GET  http://localhost:${PORT}/api/auth/validate`);
            console.log(`  GET  http://localhost:${PORT}/api/auth/profile`);
            console.log('');
            console.log('🏎️ 賽車:');
            console.log(`  GET  http://localhost:${PORT}/api/karts`);
            console.log(`  GET  http://localhost:${PORT}/api/karts/user/:userId`);
            console.log(`  POST http://localhost:${PORT}/api/karts/buy`);
            console.log('');
            console.log('🏁 賽道:');
            console.log(`  GET  http://localhost:${PORT}/api/tracks`);
            console.log(`  GET  http://localhost:${PORT}/api/tracks/random/:difficulty`);
            console.log('');
            console.log('🎮 房間:');
            console.log(`  GET  http://localhost:${PORT}/api/rooms`);
            console.log(`  POST http://localhost:${PORT}/api/rooms/create`);
            console.log(`  POST http://localhost:${PORT}/api/rooms/join`);
            console.log('');
            console.log('📦 物品:');
            console.log(`  GET  http://localhost:${PORT}/api/items`);
            console.log(`  GET  http://localhost:${PORT}/api/items/user/:userId`);
            console.log('');
            console.log('👥 好友:');
            console.log(`  GET  http://localhost:${PORT}/api/friends/:userId`);
            console.log(`  POST http://localhost:${PORT}/api/friends/request`);
            console.log('');
            console.log('🏆 賽事:');
            console.log(`  GET  http://localhost:${PORT}/api/events`);
            console.log('');
            console.log('🔧 版本:');
            console.log(`  GET  http://localhost:${PORT}/api/version?current=1.0.0`);
            console.log('');
            console.log('👤 預設帳號: admin / admin123');
        });
    } catch (error) {
        console.error('❌ 啟動失敗:', error);
        process.exit(1);
    }
}

startServer();
