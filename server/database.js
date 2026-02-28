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
    return new Promise(async (resolve, reject) => {
        const database = getDatabase();
        
        try {
            // 1. 使用者表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    nickname TEXT,
                    email TEXT,
                    level INTEGER DEFAULT 1,
                    exp INTEGER DEFAULT 0,
                    lucci INTEGER DEFAULT 10000,
                    rp INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login_at DATETIME
                )
            `);

            // 2. 賽車表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS karts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kart_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    grade TEXT DEFAULT 'C',
                    speed INTEGER DEFAULT 0,
                    acceleration INTEGER DEFAULT 0,
                    handling INTEGER DEFAULT 0,
                    drift INTEGER DEFAULT 0,
                    nitro INTEGER DEFAULT 0,
                    icon_url TEXT,
                    is_sellable BOOLEAN DEFAULT 1,
                    price_lucci INTEGER DEFAULT 0,
                    price_rp INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 3. 使用者賽車庫存表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS user_karts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    kart_id TEXT NOT NULL,
                    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_favorite BOOLEAN DEFAULT 0,
                    use_count INTEGER DEFAULT 0,
                    UNIQUE(user_id, kart_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (kart_id) REFERENCES karts(kart_id)
                )
            `);

            // 4. 賽道表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS tracks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    track_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    difficulty INTEGER DEFAULT 1,
                    theme TEXT,
                    laps INTEGER DEFAULT 3,
                    length INTEGER,
                    icon_url TEXT,
                    is_reverse BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 5. 遊戲記錄表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS game_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    track_id TEXT NOT NULL,
                    kart_id TEXT,
                    game_mode TEXT DEFAULT 'speed',
                    position INTEGER,
                    finish_time INTEGER,
                    best_lap_time INTEGER,
                    is_win BOOLEAN DEFAULT 0,
                    exp_gained INTEGER DEFAULT 0,
                    lucci_gained INTEGER DEFAULT 0,
                    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (track_id) REFERENCES tracks(track_id),
                    FOREIGN KEY (kart_id) REFERENCES karts(kart_id)
                )
            `);

            // 6. 房間表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    host_id TEXT NOT NULL,
                    track_id TEXT,
                    game_mode TEXT DEFAULT 'speed',
                    max_players INTEGER DEFAULT 8,
                    is_private BOOLEAN DEFAULT 0,
                    password TEXT,
                    status TEXT DEFAULT 'waiting',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    started_at DATETIME,
                    FOREIGN KEY (host_id) REFERENCES users(user_id),
                    FOREIGN KEY (track_id) REFERENCES tracks(track_id)
                )
            `);

            // 7. 房間玩家表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS room_players (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    is_ready BOOLEAN DEFAULT 0,
                    team INTEGER DEFAULT 0,
                    kart_id TEXT,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(room_id, user_id),
                    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (kart_id) REFERENCES karts(kart_id)
                )
            `);

            // 8. 道具/物品表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    description TEXT,
                    duration INTEGER,
                    effect_data TEXT,
                    icon_url TEXT,
                    is_sellable BOOLEAN DEFAULT 1,
                    price_lucci INTEGER DEFAULT 0,
                    price_rp INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 9. 使用者物品庫存表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS user_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME,
                    UNIQUE(user_id, item_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (item_id) REFERENCES items(item_id)
                )
            `);

            // 10. 好友系統表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS friends (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    friend_id TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, friend_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id),
                    FOREIGN KEY (friend_id) REFERENCES users(user_id)
                )
            `);

            // 11. 賽事/活動表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    event_type TEXT DEFAULT 'time_attack',
                    track_id TEXT,
                    start_at DATETIME,
                    end_at DATETIME,
                    rewards TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (track_id) REFERENCES tracks(track_id)
                )
            `);

            // 12. 版本表
            await runQuery(database, `
                CREATE TABLE IF NOT EXISTS versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT UNIQUE NOT NULL,
                    minimum_version TEXT NOT NULL,
                    download_url TEXT NOT NULL,
                    release_notes TEXT,
                    is_mandatory BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ 所有資料表建立完成');
            
            // 初始化預設資料
            await seedDatabase();
            resolve();
            
        } catch (error) {
            reject(error);
        }
    });
}

function runQuery(database, sql) {
    return new Promise((resolve, reject) => {
        database.run(sql, (err) => {
            if (err) reject(err);
            else resolve();
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
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await new Promise((resolve, reject) => {
            database.run(
                `INSERT INTO users (user_id, username, password, nickname, email, level, lucci) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), 'admin', hashedPassword, '管理員', 'admin@example.com', 1, 100000],
                (err) => {
                    if (err) return reject(err);
                    console.log('✅ 已建立預設管理員帳號 (admin / admin123)');
                    resolve();
                }
            );
        });
    }

    // 初始化預設賽車
    const kartExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM karts LIMIT 1', (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });

    if (!kartExists) {
        const defaultKarts = [
            ['kart_001', '練習用卡丁車', 'C', 50, 50, 50, 50, 50, 0, 0],
            ['kart_002', '棉花糖 SR', 'B', 70, 65, 75, 70, 80, 50000, 0],
            ['kart_003', '爆烈 SR', 'A', 85, 80, 65, 75, 85, 150000, 500],
            ['kart_004', '尖峰 SR', 'S', 95, 85, 80, 85, 90, 0, 2000],
        ];

        for (const kart of defaultKarts) {
            await new Promise((resolve, reject) => {
                database.run(
                    `INSERT INTO karts (kart_id, name, grade, speed, acceleration, handling, drift, nitro, price_lucci, price_rp) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    kart,
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });
        }
        console.log('✅ 已建立預設賽車資料');
    }

    // 初始化預設賽道
    const trackExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM tracks LIMIT 1', (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });

    if (!trackExists) {
        const defaultTracks = [
            ['track_001', '城鎮 高速公路', 2, 'village', 3, 5000],
            ['track_002', '森林 髮夾彎', 3, 'forest', 3, 4200],
            ['track_003', '沙漠 金字塔', 2, 'desert', 3, 4800],
            ['track_004', '冰河 冰山滑雪場', 4, 'ice', 3, 5500],
            ['track_005', '墓地 幽靈峽谷', 3, 'graveyard', 3, 5100],
        ];

        for (const track of defaultTracks) {
            await new Promise((resolve, reject) => {
                database.run(
                    `INSERT INTO tracks (track_id, name, difficulty, theme, laps, length) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    track,
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });
        }
        console.log('✅ 已建立預設賽道資料');
    }

    // 初始化預設物品
    const itemExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM items LIMIT 1', (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });

    if (!itemExists) {
        const defaultItems = [
            ['item_001', '經驗值加倍卡', 'buff', '30分鐘內獲得雙倍經驗值', 30, '{"exp_multiplier": 2}', 5000, 0],
            ['item_002', 'Luuc加倍卡', 'buff', '30分鐘內獲得雙倍Luuc', 30, '{"lucci_multiplier": 2}', 3000, 0],
            ['item_003', '改名卡', 'consumable', '更改使用者名稱', null, null, 10000, 100],
            ['item_004', '經驗值保護卡', 'buff', '失敗時不扣減經驗值 (3次)', null, '{"protect_count": 3}', 8000, 50],
        ];

        for (const item of defaultItems) {
            await new Promise((resolve, reject) => {
                database.run(
                    `INSERT INTO items (item_id, name, type, description, duration, effect_data, price_lucci, price_rp) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    item,
                    (err) => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });
        }
        console.log('✅ 已建立預設物品資料');
    }
    
    // 初始化版本資訊
    const versionExists = await new Promise((resolve, reject) => {
        database.get('SELECT 1 FROM versions WHERE version = ?', ['1.1.0'], (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });
    
    if (!versionExists) {
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
