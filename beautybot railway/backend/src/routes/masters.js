const { Router } = require('express');
const { getDb } = require('../database/db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const masters = db.prepare(`
    SELECT * FROM masters WHERE is_active = 1 ORDER BY sort_order, id
  `).all();
  res.json({ masters });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const master = db.prepare('SELECT * FROM masters WHERE id = ?').get(req.params.id);
  
  if (!master) {
    return res.status(404).json({ error: 'Master not found' });
  }
  
  res.json({ master });
});

module.exports = router;
