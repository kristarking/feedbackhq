const router = require('express').Router();
const seed = require('../config/seed');

// Only available in development — lets you re-trigger seeding via browser
router.post('/', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    await seed(true); // force = true, re-seeds even if data exists
    res.json({ message: 'Database seeded successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
