// 簡易測試伺服器 (Node.js)
// 用於開發測試登入器和版本驗證功能

const http = require('http');
const url = require('url');

const PORT = 3000;
const CURRENT_VERSION = "1.0.0";
const LATEST_VERSION = "1.1.0";

// 模擬使用者資料庫
const users = {
    "test": {
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // "password"
        nickname: "測試使用者",
        email: "test@example.com"
    }
};

// SHA256 雜湊驗證
function verifyPassword(inputPassword, storedHash) {
    // 實際應用應該用 crypto 模組
    return inputPassword === storedHash;
}

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    // 版本檢查 API
    if (path === '/api/version' && req.method === 'GET') {
        const clientVersion = parsedUrl.query.current;
        
        if (!clientVersion) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing version parameter' }));
            return;
        }

        const needsUpdate = compareVersions(clientVersion, LATEST_VERSION) < 0;
        const isMandatory = compareVersions(clientVersion, CURRENT_VERSION) < 0;

        res.writeHead(200);
        res.end(JSON.stringify({
            isValid: true,
            needsUpdate: needsUpdate,
            isMandatory: isMandatory,
            versionInfo: needsUpdate ? {
                latestVersion: LATEST_VERSION,
                minimumVersion: CURRENT_VERSION,
                downloadUrl: "https://example.com/download/latest",
                releaseNotes: "新增功能與錯誤修復",
                releasedAt: new Date().toISOString(),
                isMandatory: isMandatory
            } : null,
            message: needsUpdate ? "有新版本可用" : "已是最新版本"
        }));
        return;
    }

    // 登入 API
    if (path === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { username, password, clientVersion } = data;

                if (!username || !password) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: '請提供帳號和密碼' 
                    }));
                    return;
                }

                // 驗證版本
                if (compareVersions(clientVersion, CURRENT_VERSION) < 0) {
                    res.writeHead(403);
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: '版本過舊，請更新' 
                    }));
                    return;
                }

                // 驗證使用者
                const user = users[username];
                if (!user || user.password !== password) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: '帳號或密碼錯誤' 
                    }));
                    return;
                }

                // 產生 Token
                const token = generateToken(username);

                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: '登入成功',
                    authToken: token,
                    username: username,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    userInfo: {
                        userId: "U" + Math.random().toString(36).substr(2, 9),
                        nickname: user.nickname,
                        email: user.email,
                        createdAt: new Date().toISOString()
                    }
                }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ 
                    success: false, 
                    message: '無效的請求格式' 
                }));
            }
        });
        return;
    }

    // Token 驗證 API
    if (path === '/api/auth/validate' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401);
            res.end(JSON.stringify({ valid: false }));
            return;
        }

        const token = authHeader.substring(7);
        const isValid = validateToken(token);

        res.writeHead(isValid ? 200 : 401);
        res.end(JSON.stringify({ valid: isValid }));
        return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

// 版本號比較
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

// 產生簡易 Token
function generateToken(username) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2);
    return `${username}_${timestamp}_${random}`;
}

// 驗證 Token
function validateToken(token) {
    // 簡易驗證：檢查格式
    const parts = token.split('_');
    return parts.length === 3 && users[parts[0]];
}

server.listen(PORT, () => {
    console.log(`🚀 測試伺服器運行於 http://localhost:${PORT}`);
    console.log('');
    console.log('API 端點:');
    console.log(`  GET  http://localhost:${PORT}/api/version?current=1.0.0`);
    console.log(`  POST http://localhost:${PORT}/api/auth/login`);
    console.log(`  GET  http://localhost:${PORT}/api/auth/validate`);
    console.log('');
    console.log('測試帳號: test / password');
});
