const { Router } = require('express');
const { verifyTelegramInitData } = require('../middleware/auth');
const { getDb } = require('../database/db');

const router = Router();

router.post('/', verifyTelegramInitData, (req, res) => {
  const telegramUser = req.telegramUser;
  const devUser = req.devUser;

  if (!telegramUser && !devUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userData = telegramUser || {
    id: devUser.id,
    username: 'dev-user',
    isAuth: true
  };

  const db = getDb();
  
  // Upsert user
  const existingUser = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userData.id);
  
  if (existingUser) {
    db.prepare(`UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
      userData.username || null,
      existingUser.id
    );
    res.json({ user: existingUser });
  } else {
    const result = db.prepare(`
      INSERT INTO users (telegram_id, username, role) VALUES (?, ?, 'user')
    `).run(userData.id, userData.username || null);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ user });
  }
});

module.exports = router;
