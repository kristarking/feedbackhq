const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const AWSXRay = require('aws-xray-sdk');

const { sequelize } = require('./config/database');
const logger = require('./config/logger');
const seed = require('./config/seed');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const seedRoute   = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// AWS X-Ray tracing (no-op in local dev)
if (process.env.NODE_ENV === 'production') {
  AWSXRay.config([AWSXRay.plugins.ECSPlugin]);
  app.use(AWSXRay.express.openSegment('feedbackhq-api'));
}

// Security & utilities
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
app.use('/api/', limiter);

// Health check (used by ALB and ECS)
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seed',  seedRoute);

// X-Ray close segment
if (process.env.NODE_ENV === 'production') {
  app.use(AWSXRay.express.closeSegment());
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('Database synced');
    await seed();
    app.listen(PORT, () => logger.info(`API server running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

module.exports = app;
