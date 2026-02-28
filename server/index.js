require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const versionRoutes = require('./routes/version');
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
            console.log('API 端點:');
            console.log(`  POST http://localhost:${PORT}/api/auth/register`);
            console.log(`  POST http://localhost:${PORT}/api/auth/login`);
            console.log(`  GET  http://localhost:${PORT}/api/version?current=1.0.0`);
            console.log('');
            console.log('預設帳號: admin / admin123');
        });
    } catch (error) {
        console.error('❌ 啟動失敗:', error);
        process.exit(1);
    }
}

startServer();
