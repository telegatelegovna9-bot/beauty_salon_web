const { Router } = require('express');
const { getDb } = require('../database/db');
const { verifyTelegramInitData } = require('../middleware/auth');

const router = Router();

// Validate access code
router.post('/validate', verifyTelegramInitData, (req, res) => {
  const user = req.telegramUser || req.devUser;
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  const db = getDb();
  const accessCode = db.prepare('SELECT * FROM access_codes WHERE code = ?').get(code);
  
  if (!accessCode) {
    return res.status(404).json({ error: 'Invalid code' });
  }
  
  if (accessCode.is_used) {
    return res.status(400).json({ error: 'Code already used' });
  }
  
  if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Code expired' });
  }
  
  // Mark as used
  db.prepare('UPDATE access_codes SET is_used = 1, used_by = ? WHERE id = ?').run(
    user.id,
    accessCode.id
  );
  
  res.json({ success: true });
});

module.exports = router;
