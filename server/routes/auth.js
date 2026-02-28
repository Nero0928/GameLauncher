const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 註冊
router.post('/register', async (req, res) => {
    try {
        const { username, password, nickname, email } = req.body;
        
        // 驗證輸入
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '請提供帳號和密碼'
            });
        }
        
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: '帳號長度必須在 3-20 字元之間'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密碼長度至少 6 個字元'
            });
        }
        
        const db = getDatabase();
        
        // 檢查帳號是否已存在
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT 1 FROM users WHERE username = ?', [username], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '帳號已存在'
            });
        }
        
        // 雜湊密碼
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        
        // 建立使用者
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (user_id, username, password, nickname, email) VALUES (?, ?, ?, ?, ?)',
                [userId, username, hashedPassword, nickname || username, email || null],
                function(err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        res.status(201).json({
            success: true,
            message: '註冊成功',
            userId: userId
        });
        
    } catch (error) {
        console.error('註冊錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

// 登入
router.post('/login', async (req, res) => {
    try {
        const { username, password, clientVersion, deviceId } = req.body;
        
        console.log('登入嘗試:', { username, clientVersion, deviceId });
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '請提供帳號和密碼'
            });
        }
        
        const db = getDatabase();
        
        // 查詢使用者
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT user_id, username, password, nickname, email, created_at FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }
        
        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }
        
        // 產生 JWT
        const token = jwt.sign(
            { userId: user.user_id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: '登入成功',
            authToken: token,
            username: user.username,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            userInfo: {
                userId: user.user_id,
                nickname: user.nickname,
                email: user.email,
                createdAt: user.created_at
            }
        });
        
    } catch (error) {
        console.error('登入錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

// 驗證 Token
router.get('/validate', (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false, message: '未提供 Token' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        jwt.verify(token, JWT_SECRET);
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ valid: false, message: 'Token 無效或已過期' });
    }
});

// 取得使用者資料
router.get('/profile', async (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '未提供 Token' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDatabase();
        
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT user_id, username, nickname, email, created_at FROM users WHERE user_id = ?',
                [decoded.userId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: '使用者不存在' });
        }
        
        res.json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                nickname: user.nickname,
                email: user.email,
                createdAt: user.created_at
            }
        });
        
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token 無效或已過期' });
    }
});

module.exports = router;
