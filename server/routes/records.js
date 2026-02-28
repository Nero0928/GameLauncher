const express = require('express');
const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 取得使用者的遊戲記錄
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const db = getDatabase();
        
        const records = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    gr.*,
                    t.name as track_name,
                    k.name as kart_name
                FROM game_records gr
                LEFT JOIN tracks t ON gr.track_id = t.track_id
                LEFT JOIN karts k ON gr.kart_id = k.kart_id
                WHERE gr.user_id = ?
                ORDER BY gr.played_at DESC
                LIMIT ? OFFSET ?
            `, [userId, parseInt(limit), parseInt(offset)], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, records });
    } catch (error) {
        console.error('取得遊戲記錄錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得賽道最佳記錄
router.get('/track/:trackId/best', async (req, res) => {
    try {
        const { trackId } = req.params;
        const { limit = 10 } = req.query;
        
        const db = getDatabase();
        
        const records = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    gr.*,
                    u.nickname,
                    k.name as kart_name
                FROM game_records gr
                JOIN users u ON gr.user_id = u.user_id
                LEFT JOIN karts k ON gr.kart_id = k.kart_id
                WHERE gr.track_id = ? AND gr.finish_time IS NOT NULL
                ORDER BY gr.finish_time ASC
                LIMIT ?
            `, [trackId, parseInt(limit)], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, records });
    } catch (error) {
        console.error('取得最佳記錄錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 新增遊戲記錄
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            trackId,
            kartId,
            gameMode,
            position,
            finishTime,
            bestLapTime,
            isWin
        } = req.body;
        
        if (!userId || !trackId) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        const recordId = uuidv4();
        
        // 計算獲得的經驗值和貨幣
        let expGained = 0;
        let lucciGained = 0;
        
        if (isWin) {
            expGained = 100;
            lucciGained = 500;
        } else {
            expGained = 50;
            lucciGained = 200;
        }
        
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) return reject(err);
                
                // 插入記錄
                db.run(`
                    INSERT INTO game_records 
                    (record_id, user_id, track_id, kart_id, game_mode, position, finish_time, best_lap_time, is_win, exp_gained, lucci_gained)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [recordId, userId, trackId, kartId, gameMode, position, finishTime, bestLapTime, isWin ? 1 : 0, expGained, lucciGained],
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                    }
                    
                    // 更新使用者資料
                    db.run(`
                        UPDATE users 
                        SET exp = exp + ?, lucci = lucci + ?, rp = rp + ?
                        WHERE user_id = ?
                    `, [expGained, lucciGained, isWin ? 10 : 0, userId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        db.run('COMMIT', (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                });
            });
        });
        
        res.json({
            success: true,
            message: '記錄已儲存',
            recordId,
            expGained,
            lucciGained
        });
    } catch (error) {
        console.error('新增遊戲記錄錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
