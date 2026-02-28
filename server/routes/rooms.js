const express = require('express');
const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 取得所有房間
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        
        const rooms = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    r.*,
                    u.nickname as host_name,
                    t.name as track_name,
                    (SELECT COUNT(*) FROM room_players WHERE room_id = r.room_id) as player_count
                FROM rooms r
                JOIN users u ON r.host_id = u.user_id
                LEFT JOIN tracks t ON r.track_id = t.track_id
                WHERE r.status = 'waiting'
                ORDER BY r.created_at DESC
            `, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, rooms });
    } catch (error) {
        console.error('取得房間列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得房間詳細資訊
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const db = getDatabase();
        
        const room = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.*,
                    u.nickname as host_name,
                    t.name as track_name
                FROM rooms r
                JOIN users u ON r.host_id = u.user_id
                LEFT JOIN tracks t ON r.track_id = t.track_id
                WHERE r.room_id = ?
            `, [roomId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!room) {
            return res.status(404).json({ success: false, message: '房間不存在' });
        }
        
        // 取得房間玩家
        const players = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    rp.*,
                    u.nickname,
                    u.level,
                    k.name as kart_name
                FROM room_players rp
                JOIN users u ON rp.user_id = u.user_id
                LEFT JOIN karts k ON rp.kart_id = k.kart_id
                WHERE rp.room_id = ?
                ORDER BY rp.joined_at
            `, [roomId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, room, players });
    } catch (error) {
        console.error('取得房間詳細資訊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 建立房間
router.post('/create', async (req, res) => {
    try {
        const { hostId, name, trackId, gameMode, maxPlayers, isPrivate, password } = req.body;
        
        if (!hostId || !name) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        const roomId = uuidv4();
        
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO rooms (room_id, name, host_id, track_id, game_mode, max_players, is_private, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [roomId, name, hostId, trackId || null, gameMode || 'speed', maxPlayers || 8, isPrivate ? 1 : 0, password || null],
            (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        
        // 房主自動加入
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO room_players (room_id, user_id, is_ready) VALUES (?, ?, 1)',
                [roomId, hostId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        res.json({ success: true, roomId, message: '房間建立成功' });
    } catch (error) {
        console.error('建立房間錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 加入房間
router.post('/join', async (req, res) => {
    try {
        const { roomId, userId, password } = req.body;
        
        if (!roomId || !userId) {
            return res.status(400).json({ success: false, message: '缺少必要參數' });
        }
        
        const db = getDatabase();
        
        // 檢查房間
        const room = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!room) {
            return res.status(404).json({ success: false, message: '房間不存在' });
        }
        
        if (room.status !== 'waiting') {
            return res.status(400).json({ success: false, message: '房間已開始遊戲' });
        }
        
        // 檢查密碼
        if (room.is_private && room.password !== password) {
            return res.status(403).json({ success: false, message: '房間密碼錯誤' });
        }
        
        // 檢查是否已在房間
        const existing = await new Promise((resolve, reject) => {
            db.get('SELECT 1 FROM room_players WHERE room_id = ? AND user_id = ?', 
                [roomId, userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (existing) {
            return res.status(409).json({ success: false, message: '已在房間中' });
        }
        
        // 檢查人數
        const playerCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM room_players WHERE room_id = ?', 
                [roomId], (err, row) => {
                if (err) return reject(err);
                resolve(row.count);
            });
        });
        
        if (playerCount >= room.max_players) {
            return res.status(400).json({ success: false, message: '房間已滿' });
        }
        
        // 加入房間
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO room_players (room_id, user_id) VALUES (?, ?)',
                [roomId, userId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        res.json({ success: true, message: '加入房間成功' });
    } catch (error) {
        console.error('加入房間錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 離開房間
router.post('/leave', async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        
        const db = getDatabase();
        
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM room_players WHERE room_id = ? AND user_id = ?',
                [roomId, userId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
        
        // 檢查房間是否還有人
        const playerCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM room_players WHERE room_id = ?', 
                [roomId], (err, row) => {
                if (err) return reject(err);
                resolve(row.count);
            });
        });
        
        // 沒人就刪除房間
        if (playerCount === 0) {
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM rooms WHERE room_id = ?', [roomId], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
        
        res.json({ success: true, message: '已離開房間' });
    } catch (error) {
        console.error('離開房間錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
