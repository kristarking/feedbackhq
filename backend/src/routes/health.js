const router = require('express').Router();
const { sequelize } = require('../config/database');
const { getRedis } = require('../config/redis');

router.get('/', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString(), services: {} };

  try {
    await sequelize.authenticate();
    health.services.database = 'healthy';
  } catch {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    const redis = getRedis();
    await redis.ping();
    health.services.redis = 'healthy';
  } catch {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

module.exports = router;
