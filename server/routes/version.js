const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

// 檢查版本
router.get('/', async (req, res) => {
    try {
        const currentVersion = req.query.current;
        
        if (!currentVersion) {
            return res.status(400).json({
                isValid: false,
                message: '請提供目前版本號'
            });
        }
        
        const db = getDatabase();
        
        // 取得最新版本
        const latestVersion = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM versions ORDER BY created_at DESC LIMIT 1',
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (!latestVersion) {
            return res.json({
                isValid: true,
                needsUpdate: false,
                message: '無版本資訊'
            });
        }
        
        // 比較版本
        const currentParts = currentVersion.split('.').map(Number);
        const latestParts = latestVersion.version.split('.').map(Number);
        const minParts = latestVersion.minimum_version.split('.').map(Number);
        
        const needsUpdate = compareVersions(currentParts, latestParts) < 0;
        const isMandatory = compareVersions(currentParts, minParts) < 0;
        
        res.json({
            isValid: true,
            needsUpdate: needsUpdate,
            isMandatory: isMandatory,
            versionInfo: needsUpdate ? {
                latestVersion: latestVersion.version,
                minimumVersion: latestVersion.minimum_version,
                downloadUrl: latestVersion.download_url,
                releaseNotes: latestVersion.release_notes,
                releasedAt: latestVersion.created_at,
                isMandatory: isMandatory
            } : null,
            message: needsUpdate ? '有新版本可用' : '已是最新版本'
        });
        
    } catch (error) {
        console.error('版本檢查錯誤:', error);
        res.status(500).json({
            isValid: false,
            message: '伺服器錯誤'
        });
    }
});

// 取得最新版本資訊
router.get('/latest', async (req, res) => {
    try {
        const db = getDatabase();
        
        const version = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM versions ORDER BY created_at DESC LIMIT 1',
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
        
        if (!version) {
            return res.status(404).json({ success: false, message: '無版本資訊' });
        }
        
        res.json({
            success: true,
            version: {
                version: version.version,
                minimumVersion: version.minimum_version,
                downloadUrl: version.download_url,
                releaseNotes: version.release_notes,
                isMandatory: !!version.is_mandatory,
                releasedAt: version.created_at
            }
        });
        
    } catch (error) {
        console.error('取得版本資訊錯誤:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 版本號比較函數
function compareVersions(v1, v2) {
    const maxLength = Math.max(v1.length, v2.length);
    
    for (let i = 0; i < maxLength; i++) {
        const part1 = v1[i] || 0;
        const part2 = v2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

module.exports = router;
