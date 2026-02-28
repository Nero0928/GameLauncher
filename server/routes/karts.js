const express = require('express');
const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 取得所有賽車
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const karts = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM karts ORDER BY grade DESC, name', (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, karts });
    } catch (error) {
        console.error('取得賽車列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得賽車詳細資訊
router.get('/:kartId', async (req, res) => {
    try {
        const { kartId } = req.params;
        const db = getDatabase();
        
        const kart = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM karts WHERE kart_id = ?', [kartId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!kart) {
            return res.status(404).json({ success: false, message: '賽車不存在' });
        }
        
        res.json({ success: true, kart });
    } catch (error) {
        console.error('取得賽車詳細資訊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得使用者的賽車
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDatabase();
        
        const karts = await new Promise((resolve, reject) => {
            db.all(`
                SELECT k.*, uk.acquired_at, uk.is_favorite, uk.use_count
                FROM karts k
                JOIN user_karts uk ON k.kart_id = uk.kart_id
                WHERE uk.user_id = ?
                ORDER BY uk.acquired_at DESC
            `, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, karts });
    } catch (error) {
        console.error('取得使用者賽車錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 購買賽車
router.post('/buy', async (req, res) => {
    try {
        const { userId, kartId } = req.body;
        
        if (!userId || !kartId) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        
        // 檢查賽車是否存在
        const kart = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM karts WHERE kart_id = ?', [kartId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!kart) {
            return res.status(404).json({ success: false, message: '賽車不存在' });
        }
        
        // 檢查使用者是否已有此賽車
        const existing = await new Promise((resolve, reject) => {
            db.get('SELECT 1 FROM user_karts WHERE user_id = ? AND kart_id = ?', 
                [userId, kartId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (existing) {
            return res.status(409).json({ success: false, message: '已擁有此賽車' });
        }
        
        // 檢查使用者貨幣
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT lucci, rp FROM users WHERE user_id = ?', [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: '使用者不存在' });
        }
        
        // 檢查貨幣是否足夠
        if (kart.price_rp > 0 && user.rp < kart.price_rp) {
            return res.status(400).json({ success: false, message: 'RP 不足' });
        }
        if (kart.price_lucci > 0 && user.lucci < kart.price_lucci) {
            return res.status(400).json({ success: false, message: 'Lucci 不足' });
        }
        
        // 扣除貨幣並新增賽車
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) return reject(err);
                
                db.run(
                    'UPDATE users SET lucci = lucci - ?, rp = rp - ? WHERE user_id = ?',
                    [kart.price_lucci, kart.price_rp, userId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        db.run(
                            'INSERT INTO user_karts (user_id, kart_id) VALUES (?, ?)',
                            [userId, kartId],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                
                                db.run('COMMIT', (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            }
                        );
                    }
                );
            });
        });
        
        res.json({ success: true, message: '購買成功' });
    } catch (error) {
        console.error('購買賽車錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
