const express = require('express');
const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 取得所有進行中的賽事
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        
        const events = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    e.*,
                    t.name as track_name
                FROM events e
                LEFT JOIN tracks t ON e.track_id = t.track_id
                WHERE e.is_active = 1
                AND e.end_at > datetime('now')
                AND e.start_at <= datetime('now')
                ORDER BY e.end_at
            `, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, events });
    } catch (error) {
        console.error('取得賽事列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得賽事詳細資訊
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const db = getDatabase();
        
        const event = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    e.*,
                    t.name as track_name
                FROM events e
                LEFT JOIN tracks t ON e.track_id = t.track_id
                WHERE e.event_id = ?
            `, [eventId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!event) {
            return res.status(404).json({ success: false, message: '賽事不存在' });
        }
        
        res.json({ success: true, event });
    } catch (error) {
        console.error('取得賽事詳細資訊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 建立賽事 (管理員功能)
router.post('/create', async (req, res) => {
    try {
        const { title, description, eventType, trackId, startAt, endAt, rewards } = req.body;
        
        if (!title || !startAt || !endAt) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        const eventId = uuidv4();
        
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO events (event_id, title, description, event_type, track_id, start_at, end_at, rewards)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [eventId, title, description, eventType || 'time_attack', trackId || null, startAt, endAt, JSON.stringify(rewards || {})],
            (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        
        res.json({ success: true, eventId, message: '賽事建立成功' });
    } catch (error) {
        console.error('建立賽事錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得賽事排行榜
router.get('/:eventId/leaderboard', async (req, res) => {
    try {
        const { eventId } = req.params;
        const db = getDatabase();
        
        const event = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM events WHERE event_id = ?', [eventId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!event) {
            return res.status(404).json({ success: false, message: '賽事不存在' });
        }
        
        // 根據賽道取得最佳記錄
        const records = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    gr.*,
                    u.nickname,
                    k.name as kart_name
                FROM game_records gr
                JOIN users u ON gr.user_id = u.user_id
                LEFT JOIN karts k ON gr.kart_id = k.kart_id
                WHERE gr.track_id = ?
                AND gr.played_at BETWEEN ? AND ?
                AND gr.finish_time IS NOT NULL
                ORDER BY gr.finish_time ASC
                LIMIT 100
            `, [event.track_id, event.start_at, event.end_at], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, event, leaderboard: records });
    } catch (error) {
        console.error('取得賽事排行榜錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
