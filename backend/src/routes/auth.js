const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { getDb } = require('../database/db');

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.env.UPLOADS_PATH || './uploads/avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar-${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP images are allowed'));
  }
});

// POST /api/auth/avatar - upload user avatar
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), (req, res) => {
  const db = getDb();

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const baseUrl = process.env.WEBAPP_URL || `http://localhost:${process.env.PORT || 3001}`;
  const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

  // Delete old avatar file if exists
  const currentUser = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user.id);
  if (currentUser?.avatar_url && currentUser.avatar_url.includes('/uploads/')) {
    const oldFilename = path.basename(currentUser.avatar_url);
    const oldPath = path.resolve(process.env.UPLOADS_PATH || './uploads/avatars', oldFilename);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, avatar_url: avatarUrl, user: updated });
});

// POST /api/auth - authenticate and get user profile
router.post('/', authMiddleware, (req, res) => {
  const db = getDb();
  const user = req.user;

  let masterProfile = null;
  if (user.role === 'master' || user.role === 'admin') {
    masterProfile = db.prepare(`
      SELECT mp.*, 
        (SELECT COUNT(*) FROM bookings b WHERE b.master_id = mp.id AND b.status = 'completed') as completed_bookings
      FROM masters_profiles mp WHERE mp.user_id = ?
    `).get(user.id);

    if (masterProfile && masterProfile.specializations) {
      try { masterProfile.specializations = JSON.parse(masterProfile.specializations); } catch { masterProfile.specializations = []; }
    }
  }

  const clientProfile = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(user.id);

  res.json({
    user: {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    },
    master_profile: masterProfile,
    client_profile: clientProfile
  });
});

// GET /api/auth/me - get current user
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = req.user;

  let masterProfile = null;
  if (user.role === 'master' || user.role === 'admin') {
    masterProfile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(user.id);
    if (masterProfile && masterProfile.specializations) {
      try { masterProfile.specializations = JSON.parse(masterProfile.specializations); } catch { masterProfile.specializations = []; }
    }
  }

  res.json({
    user: {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url
    },
    master_profile: masterProfile
  });
});

// PUT /api/auth/profile - update profile
router.put('/profile', authMiddleware, (req, res) => {
  const db = getDb();
  const { phone, first_name, last_name, avatar_url } = req.body;

  const updates = [];
  const params = [];

  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || null); }
  if (first_name !== undefined) { updates.push('first_name = ?'); params.push(first_name); }
  if (last_name !== undefined) { updates.push('last_name = ?'); params.push(last_name); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }

  if (updates.length > 0) {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, user: updated });
});

// POST /api/auth/activate-code - activate access code
router.post('/activate-code', authMiddleware, (req, res) => {
  const db = getDb();
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const accessCode = db.prepare(`
    SELECT * FROM access_codes 
    WHERE code = ? AND is_active = 1 AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).get(code.trim().toUpperCase());

  if (!accessCode) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  const activateCode = db.transaction(() => {
    db.prepare(`
      UPDATE access_codes SET used_by = ?, used_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?
    `).run(req.user.id, accessCode.id);

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(accessCode.role, req.user.id);

    if (accessCode.role === 'master') {
      const existing = db.prepare('SELECT id FROM masters_profiles WHERE user_id = ?').get(req.user.id);
      if (!existing) {
        db.prepare(`
          INSERT INTO masters_profiles (user_id, display_name, specializations)
          VALUES (?, ?, '[]')
        `).run(req.user.id, `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.username || 'Мастер');
      }
    }
  });

  activateCode();

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const masterProfile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);

  res.json({
    success: true,
    message: `Роль ${accessCode.role} успешно активирована`,
    user: updatedUser,
    master_profile: masterProfile
  });
});

// POST /api/auth/create-master-profile - admin creates own master profile
router.post('/create-master-profile', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { display_name } = req.body;

  const existing = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) {
    try { existing.specializations = JSON.parse(existing.specializations || '[]'); } catch { existing.specializations = []; }
    return res.json({ success: true, master_profile: existing, message: 'Profile already exists' });
  }

  const name = display_name ||
    `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() ||
    req.user.username || 'Администратор';

  const result = db.prepare(`
    INSERT INTO masters_profiles (user_id, display_name, specializations, is_active)
    VALUES (?, ?, '[]', 1)
  `).run(req.user.id, name);

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE id = ?').get(result.lastInsertRowid);
  try { profile.specializations = JSON.parse(profile.specializations || '[]'); } catch { profile.specializations = []; }

  res.json({ success: true, master_profile: profile });
});

module.exports = router;
