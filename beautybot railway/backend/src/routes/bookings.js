const { Router } = require('express');
const { getDb } = require('../database/db');
const { verifyTelegramInitData } = require('../middleware/auth');

const router = Router();

// Create booking
router.post('/', verifyTelegramInitData, (req, res) => {
  const user = req.telegramUser || req.devUser;
  const { masterId, serviceId, date, timeStart, timeEnd, notes } = req.body;
  
  if (!masterId || !serviceId || !date || !timeStart || !timeEnd) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO bookings (user_id, master_id, service_id, date, time_start, time_end, notes, status)
    VALUES ((SELECT id FROM users WHERE telegram_id = ?), ?, ?, ?, ?, ?, ?, 'pending')
  `).run(user.id, masterId, serviceId, date, timeStart, timeEnd, notes || null);
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json({ booking });
});

// Get user bookings
router.get('/my', verifyTelegramInitData, (req, res) => {
  const user = req.telegramUser || req.devUser;
  const db = getDb();
  
  const bookings = db.prepare(`
    SELECT b.*, s.name as service_name, m.name as master_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters m ON b.master_id = m.id
    WHERE b.user_id = (SELECT id FROM users WHERE telegram_id = ?)
    ORDER BY b.date DESC, b.time_start DESC
  `).all(user.id);
  
  res.json({ bookings });
});

// Update booking status (admin/bot)
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, cancel_reason } = req.body;
  
  const db = getDb();
  
  db.prepare(`
    UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);
  
  res.json({ success: true });
});

module.exports = router;
