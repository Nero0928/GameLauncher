const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

// 取得所有物品
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const items = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM items ORDER BY type, name', (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, items });
    } catch (error) {
        console.error('取得物品列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得使用者的物品
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDatabase();
        
        const items = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    i.*,
                    ui.quantity,
                    ui.acquired_at,
                    ui.expires_at
                FROM items i
                JOIN user_items ui ON i.item_id = ui.item_id
                WHERE ui.user_id = ?
                ORDER BY ui.acquired_at DESC
            `, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, items });
    } catch (error) {
        console.error('取得使用者物品錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 購買物品
router.post('/buy', async (req, res) => {
    try {
        const { userId, itemId, quantity = 1 } = req.body;
        
        if (!userId || !itemId) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        
        // 檢查物品
        const item = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM items WHERE item_id = ?', [itemId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!item) {
            return res.status(404).json({ success: false, message: '物品不存在' });
        }
        
        const totalPriceLucci = item.price_lucci * quantity;
        const totalPriceRp = item.price_rp * quantity;
        
        // 檢查貨幣
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT lucci, rp FROM users WHERE user_id = ?', [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (user.rp < totalPriceRp || user.lucci < totalPriceLucci) {
            return res.status(400).json({ success: false, message: '貨幣不足' });
        }
        
        // 購買
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) return reject(err);
                
                // 扣除貨幣
                db.run(
                    'UPDATE users SET lucci = lucci - ?, rp = rp - ? WHERE user_id = ?',
                    [totalPriceLucci, totalPriceRp, userId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        // 檢查是否已有此物品
                        db.get(
                            'SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ?',
                            [userId, itemId],
                            (err, row) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                
                                if (row) {
                                    // 更新數量
                                    db.run(
                                        'UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
                                        [quantity, userId, itemId],
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
                                } else {
                                    // 新增記錄
                                    db.run(
                                        'INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)',
                                        [userId, itemId, quantity],
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
                            }
                        );
                    }
                );
            });
        });
        
        res.json({ success: true, message: '購買成功' });
    } catch (error) {
        console.error('購買物品錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 使用物品
router.post('/use', async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        
        const db = getDatabase();
        
        // 檢查物品數量
        const userItem = await new Promise((resolve, reject) => {
            db.get(
                'SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ?',
                [userId, itemId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (!userItem || userItem.quantity <= 0) {
            return res.status(400).json({ success: false, message: '物品不足' });
        }
        
        // 扣除數量
        await new Promise((resolve, reject) => {
            if (userItem.quantity <= 1) {
                db.run(
                    'DELETE FROM user_items WHERE user_id = ? AND item_id = ?',
                    [userId, itemId],
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            } else {
                db.run(
                    'UPDATE user_items SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ?',
                    [userId, itemId],
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            }
        });
        
        res.json({ success: true, message: '使用成功' });
    } catch (error) {
        console.error('使用物品錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
