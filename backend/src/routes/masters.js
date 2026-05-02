const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { adminOnly, masterOrAdmin } = require('../middleware/rbac');
const { getDb } = require('../database/db');

// Configure multer for master avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.env.UPLOADS_PATH || './uploads/avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const profile = getDb().prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    const masterId = profile ? profile.id : 'unknown';
    const name = `master-${masterId}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP images are allowed'));
  }
});

// POST /api/masters/me/avatar - upload master avatar
router.post('/me/avatar', authMiddleware, masterOrAdmin, avatarUpload.single('avatar'), (req, res) => {
  const db = getDb();

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const baseUrl = process.env.WEBAPP_URL || `http://localhost:${process.env.PORT || 3001}`;
  const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

  // Delete old avatar
  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (profile?.avatar_url && profile.avatar_url.includes('/uploads/')) {
    const oldFilename = path.basename(profile.avatar_url);
    const oldPath = path.resolve(process.env.UPLOADS_PATH || './uploads/avatars', oldFilename);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE masters_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
    .run(avatarUrl, req.user.id);

  const updated = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  try { updated.specializations = JSON.parse(updated.specializations || '[]'); } catch { updated.specializations = []; }

  res.json({ success: true, avatar_url: avatarUrl, master_profile: updated });
});

// GET /api/masters - list all active masters
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { service_id } = req.query;

  let query = `
    SELECT mp.*, u.username, u.first_name, u.last_name, u.telegram_id, u.avatar_url as user_avatar_url
    FROM masters_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.is_active = 1
  `;
  const params = [];

  if (service_id) {
    query = `
      SELECT mp.*, u.username, u.first_name, u.last_name, u.telegram_id, u.avatar_url as user_avatar_url,
        ms.custom_price, ms.custom_duration
      FROM masters_profiles mp
      JOIN users u ON mp.user_id = u.id
      JOIN master_services ms ON ms.master_id = mp.id
      WHERE mp.is_active = 1 AND ms.service_id = ?
    `;
    params.push(service_id);
  }

  query += ' ORDER BY mp.rating DESC, mp.reviews_count DESC';

  const masters = db.prepare(query).all(...params);

  masters.forEach(m => {
    try { m.specializations = JSON.parse(m.specializations || '[]'); } catch { m.specializations = []; }
    // Fallback to user_avatar_url if master doesn't have its own
    if (!m.avatar_url && m.user_avatar_url) {
      m.avatar_url = m.user_avatar_url;
    }
  });

  res.json({ masters });
});

// GET /api/masters/me - get own master profile
router.get('/me', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  try { profile.specializations = JSON.parse(profile.specializations || '[]'); } catch { profile.specializations = []; }

  const services = db.prepare(`
    SELECT s.*, ms.custom_price, ms.custom_duration
    FROM master_services ms
    JOIN services s ON ms.service_id = s.id
    WHERE ms.master_id = ?
  `).all(profile.id);

  const schedule = db.prepare('SELECT * FROM schedules WHERE master_id = ? ORDER BY day_of_week').all(profile.id);
  const breaks = db.prepare('SELECT * FROM schedule_breaks WHERE master_id = ?').all(profile.id);

  res.json({ profile, services, schedule, breaks });
});

// PUT /api/masters/me - update own profile
router.put('/me', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { display_name, bio, specializations, experience_years } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  db.prepare(`
    UPDATE masters_profiles SET
      display_name = ?, bio = ?, specializations = ?, experience_years = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    display_name ?? profile.display_name,
    bio ?? profile.bio,
    JSON.stringify(specializations ?? JSON.parse(profile.specializations || '[]')),
    experience_years ?? profile.experience_years,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  try { updated.specializations = JSON.parse(updated.specializations || '[]'); } catch { updated.specializations = []; }

  res.json({ profile: updated });
});

// POST /api/masters/me/services - add service to master
router.post('/me/services', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { service_id, custom_price, custom_duration } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  db.prepare(`
    INSERT OR REPLACE INTO master_services (master_id, service_id, custom_price, custom_duration)
    VALUES (?, ?, ?, ?)
  `).run(profile.id, service_id, custom_price || null, custom_duration || null);

  res.json({ success: true });
});

// DELETE /api/masters/me/services/:serviceId
router.delete('/me/services/:serviceId', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  db.prepare('DELETE FROM master_services WHERE master_id = ? AND service_id = ?').run(profile.id, req.params.serviceId);
  res.json({ success: true });
});

// GET /api/masters/:id - public master profile
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();

  const master = db.prepare(`
    SELECT mp.*, u.username, u.first_name, u.last_name, u.avatar_url as user_avatar_url
    FROM masters_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.id = ? AND mp.is_active = 1
  `).get(req.params.id);

  if (!master) return res.status(404).json({ error: 'Master not found' });

  try { master.specializations = JSON.parse(master.specializations || '[]'); } catch { master.specializations = []; }
  if (!master.avatar_url && master.user_avatar_url) {
    master.avatar_url = master.user_avatar_url;
  }

  const services = db.prepare(`
    SELECT s.*, ms.custom_price, ms.custom_duration
    FROM master_services ms
    JOIN services s ON ms.service_id = s.id
    WHERE ms.master_id = ? AND s.is_active = 1
  `).all(master.id);

  const portfolio = db.prepare(`
    SELECT * FROM portfolio_items WHERE master_id = ? ORDER BY is_featured DESC, sort_order ASC, created_at DESC
  `).all(master.id);

  const reviews = db.prepare(`
    SELECT r.*, u.first_name, u.last_name, u.username
    FROM reviews r
    JOIN users u ON r.client_id = u.id
    WHERE r.master_id = ? AND r.is_published = 1
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(master.id);

  res.json({ master, services, portfolio, reviews });
});

// PUT /api/masters/:id - admin update any master
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { display_name, bio, specializations, experience_years, is_active } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE id = ?').get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Master not found' });

  db.prepare(`
    UPDATE masters_profiles SET
      display_name = ?, bio = ?, specializations = ?, experience_years = ?,
      is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    display_name ?? profile.display_name,
    bio ?? profile.bio,
    JSON.stringify(specializations ?? JSON.parse(profile.specializations || '[]')),
    experience_years ?? profile.experience_years,
    is_active ?? profile.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM masters_profiles WHERE id = ?').get(req.params.id);
  res.json({ profile: updated });
});

module.exports = router;
