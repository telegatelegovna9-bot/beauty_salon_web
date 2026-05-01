const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { getDb } = require('../database/db');

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

// GET /api/admin/dashboard - dashboard stats
router.get('/dashboard', (req, res) => {
  const db = getDb();

  const stats = {
    total_users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
    total_clients: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'client'").get().c,
    total_masters: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'master'").get().c,
    total_bookings: db.prepare("SELECT COUNT(*) as c FROM bookings").get().c,
    bookings_today: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE booking_date = date('now')").get().c,
    bookings_pending: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").get().c,
    bookings_confirmed: db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'").get().c,
    revenue_total: db.prepare("SELECT COALESCE(SUM(price), 0) as r FROM bookings WHERE status = 'completed'").get().r,
    revenue_month: db.prepare("SELECT COALESCE(SUM(price), 0) as r FROM bookings WHERE status = 'completed' AND strftime('%Y-%m', booking_date) = strftime('%Y-%m', 'now')").get().r,
    revenue_today: db.prepare("SELECT COALESCE(SUM(price), 0) as r FROM bookings WHERE status = 'completed' AND booking_date = date('now')").get().r,
  };

  // Recent bookings
  const recent_bookings = db.prepare(`
    SELECT b.*, s.name as service_name, mp.display_name as master_name,
      u.first_name as client_first_name, u.last_name as client_last_name, u.username as client_username
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u ON b.client_id = u.id
    ORDER BY b.created_at DESC LIMIT 10
  `).all();

  // Top masters
  const top_masters = db.prepare(`
    SELECT mp.display_name, mp.rating, mp.reviews_count,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(b.price), 0) as total_revenue
    FROM masters_profiles mp
    LEFT JOIN bookings b ON b.master_id = mp.id AND b.status = 'completed'
    WHERE mp.is_active = 1
    GROUP BY mp.id
    ORDER BY total_revenue DESC
    LIMIT 5
  `).all();

  res.json({ stats, recent_bookings, top_masters });
});

// GET /api/admin/users - list all users
router.get('/users', (req, res) => {
  const db = getDb();
  const { role, status, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT u.*,
      c.crm_status, c.total_visits, c.total_spent, c.last_visit_date,
      mp.display_name as master_display_name, mp.is_active as master_is_active
    FROM users u
    LEFT JOIN clients c ON c.user_id = u.id
    LEFT JOIN masters_profiles mp ON mp.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (role) { query += ' AND u.role = ?'; params.push(role); }
  if (status) { query += ' AND u.status = ?'; params.push(status); }
  if (search) {
    query += ' AND (u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.telegram_id LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

  res.json({ users, total });
});

// PUT /api/admin/users/:id - update user
router.put('/users/:id', (req, res) => {
  const db = getDb();
  const { role, status } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Prevent admin from demoting themselves
  if (String(req.params.id) === String(req.user.id) && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  if (role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);

    // Create master profile if promoting to master
    if (role === 'master') {
      const existing = db.prepare('SELECT id FROM masters_profiles WHERE user_id = ?').get(req.params.id);
      if (!existing) {
        db.prepare(`
          INSERT INTO masters_profiles (user_id, display_name, specializations)
          VALUES (?, ?, '[]')
        `).run(req.params.id, `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Мастер');
      }
    }
  }

  if (status) {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ user: updated });
});

// GET /api/admin/crm - CRM clients list
router.get('/crm', (req, res) => {
  const db = getDb();
  const { crm_status, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT u.*, c.crm_status, c.total_visits, c.total_spent, c.last_visit_date, c.notes, c.tags
    FROM users u
    JOIN clients c ON c.user_id = u.id
    WHERE u.role = 'client'
  `;
  const params = [];

  if (crm_status) { query += ' AND c.crm_status = ?'; params.push(crm_status); }
  if (search) {
    query += ' AND (u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY c.total_spent DESC, c.total_visits DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const clients = db.prepare(query).all(...params);

  clients.forEach(c => {
    try { c.tags = JSON.parse(c.tags || '[]'); } catch { c.tags = []; }
  });

  res.json({ clients });
});

// PUT /api/admin/crm/:userId - update client CRM data
router.put('/crm/:userId', (req, res) => {
  const db = getDb();
  const { crm_status, notes, tags } = req.body;

  const client = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(req.params.userId);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  db.prepare(`
    UPDATE clients SET
      crm_status = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    crm_status ?? client.crm_status,
    notes ?? client.notes,
    JSON.stringify(tags ?? JSON.parse(client.tags || '[]')),
    req.params.userId
  );

  const updated = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(req.params.userId);
  res.json({ client: updated });
});

// GET /api/admin/analytics - analytics data
router.get('/analytics', (req, res) => {
  const db = getDb();
  const { period = '30' } = req.query;

  const days = parseInt(period);

  // Bookings by day
  const bookings_by_day = db.prepare(`
    SELECT booking_date, COUNT(*) as count, COALESCE(SUM(price), 0) as revenue
    FROM bookings
    WHERE booking_date >= date('now', '-${days} days')
    GROUP BY booking_date
    ORDER BY booking_date ASC
  `).all();

  // Bookings by service category
  const by_category = db.prepare(`
    SELECT s.category, COUNT(*) as count, COALESCE(SUM(b.price), 0) as revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.booking_date >= date('now', '-${days} days') AND b.status = 'completed'
    GROUP BY s.category
  `).all();

  // Bookings by status
  const by_status = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM bookings
    WHERE booking_date >= date('now', '-${days} days')
    GROUP BY status
  `).all();

  // Top services
  const top_services = db.prepare(`
    SELECT s.name, s.category, COUNT(*) as bookings_count, COALESCE(SUM(b.price), 0) as revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.status = 'completed'
    GROUP BY s.id
    ORDER BY bookings_count DESC
    LIMIT 10
  `).all();

  res.json({ bookings_by_day, by_category, by_status, top_services });
});

// POST /api/admin/notify - send notification to user
router.post('/notify', (req, res) => {
  const db = getDb();
  const { user_id, message, type = 'custom' } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: 'user_id and message are required' });
  }

  const result = db.prepare(`
    INSERT INTO notifications_log (user_id, type, message, status)
    VALUES (?, ?, ?, 'pending')
  `).run(user_id, type, message);

  res.json({ success: true, notification_id: result.lastInsertRowid });
});

module.exports = router;
