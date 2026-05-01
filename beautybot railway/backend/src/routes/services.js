const { Router } = require('express');
const { getDb } = require('../database/db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const services = db.prepare(`
    SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order, id
  `).all();
  res.json({ services });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  res.json({ service });
});

module.exports = router;
