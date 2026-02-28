const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

// 取得所有賽道
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const tracks = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM tracks ORDER BY difficulty, name', (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        res.json({ success: true, tracks });
    } catch (error) {
        console.error('取得賽道列表錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 取得賽道詳細資訊
router.get('/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;
        const db = getDatabase();
        
        const track = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM tracks WHERE track_id = ?', [trackId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!track) {
            return res.status(404).json({ success: false, message: '賽道不存在' });
        }
        
        res.json({ success: true, track });
    } catch (error) {
        console.error('取得賽道詳細資訊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 隨機選擇賽道
router.get('/random/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        const db = getDatabase();
        
        let query = 'SELECT * FROM tracks';
        let params = [];
        
        if (difficulty !== 'all') {
            query += ' WHERE difficulty = ?';
            params = [difficulty];
        }
        
        query += ' ORDER BY RANDOM() LIMIT 1';
        
        const track = await new Promise((resolve, reject) => {
            db.get(query, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (!track) {
            return res.status(404).json({ success: false, message: '找不到符合條件的賽道' });
        }
        
        res.json({ success: true, track });
    } catch (error) {
        console.error('隨機選擇賽道錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

module.exports = router;
