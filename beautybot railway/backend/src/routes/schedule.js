const { Router } = require('express');
const { getDb } = require('../database/db');

const router = Router();

router.get('/slots', (req, res) => {
  const { masterId, date } = req.query;
  
  if (!masterId || !date) {
    return res.status(400).json({ error: 'masterId and date are required' });
  }
  
  const db = getDb();
  
  // Get booked time slots
  const bookedSlots = db.prepare(`
    SELECT time_start, time_end FROM bookings 
    WHERE master_id = ? AND date = ? AND status != 'cancelled'
  `).all(masterId, date);
  
  // Generate available slots (9:00 - 19:00, 1 hour each)
  const allSlots = [];
  for (let hour = 9; hour < 19; hour++) {
    const timeStart = `${hour.toString().padStart(2, '0')}:00`;
    const timeEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    const isBooked = bookedSlots.some(slot => 
      slot.time_start === timeStart
    );
    
    allSlots.push({
      time: timeStart,
      available: !isBooked
    });
  }
  
  res.json({ slots: allSlots });
});

module.exports = router;
