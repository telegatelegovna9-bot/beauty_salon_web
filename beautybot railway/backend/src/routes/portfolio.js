const { Router } = require('express');
const { getDb } = require('../database/db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { masterId } = req.query;
  
  let query = `
    SELECT p.*, m.name as master_name
    FROM portfolio p
    LEFT JOIN masters m ON p.master_id = m.id
  `;
  
  if (masterId) {
    query += ` WHERE p.master_id = ?`;
  }
  
  const items = db.prepare(query).all(masterId || undefined);
  res.json({ portfolio: items });
});

module.exports = router;
