const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

// 取得好友列表
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status = 'accepted' } = req.query;
        
        const db = getDatabase();
        
        const friends = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    f.*,
                    u.nickname,
                    u.level,
                    CASE 
                        WHEN f.user_id = ? THEN f.friend_id 
                        ELSE f.user_id 
                    END as friend_user_id
                FROM friends f
                JOIN users u ON (
                    CASE 
                        WHEN f.user_id = ? THEN f.friend_id 
                        ELSE f.user_id 
                    END
                ) = u.user_id
                WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = ?
                ORDER BY f.created_at DESC
            `, [userId, userId, userId, userId, status], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, friends });
    } catch (error) {
        console.error('取得好友列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 發送好友請求
router.post('/request', async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        
        if (!userId || !friendId) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        if (userId === friendId) {
            return res.status(400).json({ success: false, message: '不能加自己為好友' });
        }
        
        const db = getDatabase();
        
        // 檢查對方是否存在
        const friend = await new Promise((resolve, reject) => {
            db.get('SELECT 1 FROM users WHERE user_id = ?', [friendId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!friend) {
            return res.status(404).json({ success: false, message: '使用者不存在' });
        }
        
        // 檢查是否已有關係
        const existing = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(409).json({ success: false, message: '已經是好友' });
            } else if (existing.user_id === userId) {
                return res.status(409).json({ success: false, message: '已發送過請求' });
            } else {
                // 對方已發送請求，直接接受
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE friends SET status = ? WHERE id = ?',
                        ['accepted', existing.id],
                        (err) => {
                            if (err) return reject(err);
                            resolve();
                        }
                    );
                });
                return res.json({ success: true, message: '已成為好友' });
            }
        }
        
        // 新增好友請求
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
                [userId, friendId, 'pending'],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        res.json({ success: true, message: '好友請求已發送' });
    } catch (error) {
        console.error('發送好友請求錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 接受好友請求
router.post('/accept', async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        
        const db = getDatabase();
        
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
                ['accepted', friendId, userId],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('找不到請求'));
                    }
                    resolve();
                }
            );
        });
        
        res.json({ success: true, message: '已接受好友請求' });
    } catch (error) {
        console.error('接受好友請求錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 刪除好友
router.post('/remove', async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        
        const db = getDatabase();
        
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        res.json({ success: true, message: '已刪除好友' });
    } catch (error) {
        console.error('刪除好友錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
