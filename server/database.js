const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db = null;

function getDatabase() {
    if (!db) {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('資料庫連線失敗:', err);
            } else {
                console.log('已連線到 SQLite 資料庫');
            }
        });
    }
    return db;
}

function initDatabase() {
    return new Promise((resolve, reject) => {
        const database = getDatabase();
        
        // 建立使用者表
        database.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nickname TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) return reject(err);
            
            // 建立版本表
            database.run(`
                CREATE TABLE IF NOT EXISTS versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT UNIQUE NOT NULL,
                    minimum_version TEXT NOT NULL,
                    download_url TEXT NOT NULL,
                    release_notes TEXT,
                    is_mandatory BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, async (err) => {
                if (err) return reject(err);
                
                // 初始化預設資料
                await seedDatabase();
                resolve();
            });
        });
    });
}

async function seedDatabase() {
    const database = getDatabase();
    
    // 檢查是否已有預設使用者
    const adminExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM users WHERE username = ?', ['admin'], (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });
    
    if (!adminExists) {
        // 建立預設管理員帳號
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await new Promise((resolve, reject) => {
            database.run(
                'INSERT INTO users (user_id, username, password, nickname, email) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), 'admin', hashedPassword, '管理員', 'admin@example.com'],
                (err) => {
                    if (err) return reject(err);
                    console.log('✅ 已建立預設管理員帳號 (admin / admin123)');
                    resolve();
                }
            );
        });
    }
    
    // 檢查是否已有版本資訊
    const versionExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM versions WHERE version = ?', ['1.1.0'], (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });
    
    if (!versionExists) {
        // 建立預設版本資訊
        await new Promise((resolve, reject) => {
            database.run(
                'INSERT INTO versions (version, minimum_version, download_url, release_notes, is_mandatory) VALUES (?, ?, ?, ?, ?)',
                ['1.1.0', '1.0.0', 'https://example.com/download/1.1.0', '新增功能與效能優化', 0],
                (err) => {
                    if (err) return reject(err);
                    console.log('✅ 已建立預設版本資訊 (v1.1.0)');
                    resolve();
                }
            );
        });
    }
}

module.exports = {
    getDatabase,
    initDatabase
};
