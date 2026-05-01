const { Router } = require('express');
const { getDb } = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

// Dashboard stats
router.get('/dashboard', requireAdmin, (req, res) => {
  const db = getDb();
  
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get();
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  res.json({
    stats: {
      totalBookings: totalBookings.count,
      pendingBookings: pendingBookings.count,
      totalUsers: totalUsers.count
    }
  });
});

// Get all bookings
router.get('/bookings', requireAdmin, (req, res) => {
  const db = getDb();
  
  const bookings = db.prepare(`
    SELECT b.*, u.telegram_id, s.name as service_name, m.name as master_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN services s ON b.service_id = s.id
    JOIN masters m ON b.master_id = m.id
    ORDER BY b.date DESC
  `).all();
  
  res.json({ bookings });
});

module.exports = router;
