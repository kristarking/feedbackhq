const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const logger = require('./logger');

const seed = async (force = false) => {
  try {
    const userCount = await User.count();
    if (userCount > 0 && !force) {
      logger.info('Database already seeded, skipping.');
      return;
    }

    if (force) {
      // Wipe existing data cleanly
      await Review.destroy({ where: {}, truncate: false });
      await Product.destroy({ where: {}, truncate: false });
      await User.destroy({ where: {}, truncate: false });
      logger.info('Cleared existing data for re-seed.');
    }

    logger.info('Seeding database...');

    const admin = await User.create({ name: 'Admin User',  email: 'admin@feedbackhq.com', password: 'Admin@123', role: 'admin' });
    const john  = await User.create({ name: 'John Doe',    email: 'john@example.com',      password: 'User@123',  role: 'user'  });
    const jane  = await User.create({ name: 'Jane Smith',  email: 'jane@example.com',      password: 'User@123',  role: 'user'  });

    const p1 = await Product.create({ name: 'CloudStorage Pro', category: 'Software',   description: 'Enterprise cloud storage solution with unlimited scalability and 99.99% uptime.' });
    const p2 = await Product.create({ name: 'DevDeploy Suite',  category: 'DevOps',     description: 'CI/CD and deployment automation toolkit for modern engineering teams.' });
    const p3 = await Product.create({ name: 'MonitorX',         category: 'Monitoring', description: 'Full-stack observability platform with real-time alerts and dashboards.' });
    const p4 = await Product.create({ name: 'SecureVault',      category: 'Security',   description: 'Secrets and credentials management built for cloud-native environments.' });

    await Review.create({ userId: john.id,  productId: p1.id, rating: 5, title: 'Absolutely love it',              body: 'CloudStorage Pro has been a game changer for our team. Reliability is unmatched and performance is excellent.' });
    await Review.create({ userId: jane.id,  productId: p1.id, rating: 4, title: 'Great product, minor UX issues',  body: 'Really solid storage solution. The dashboard could use improvements but overall very happy.' });
    await Review.create({ userId: john.id,  productId: p2.id, rating: 5, title: 'Best CI/CD tool I have used',     body: 'DevDeploy Suite cut our deployment time from 30 minutes to under 5. Rollback feature has saved us multiple times.' });
    await Review.create({ userId: jane.id,  productId: p2.id, rating: 4, title: 'Solid automation, some rough edges', body: 'Great pipeline tooling. Documentation could be improved but support team is very responsive.' });
    await Review.create({ userId: jane.id,  productId: p3.id, rating: 4, title: 'Solid monitoring platform',       body: 'MonitorX gives full visibility into our infrastructure. Alert fatigue can be an issue but the signal-to-noise ratio is good.' });
    await Review.create({ userId: john.id,  productId: p3.id, rating: 5, title: 'Replaced three other tools',      body: 'We replaced Datadog, PagerDuty, and Grafana with MonitorX. Incredible value and the unified interface is great.' });
    await Review.create({ userId: john.id,  productId: p4.id, rating: 5, title: 'Finally a secrets manager that works', body: 'SecureVault integrates perfectly with our setup. Rotation policies and audit logs are excellent.' });
    await Review.create({ userId: jane.id,  productId: p4.id, rating: 5, title: 'Essential for any cloud team',    body: 'We have been using SecureVault for 6 months. Zero incidents and the developer experience is top notch.' });

    logger.info('✅ Database seeded!');
    logger.info('   Admin -> admin@feedbackhq.com / Admin@123');
    logger.info('   User  -> john@example.com / User@123');
  } catch (err) {
    logger.error('Seeding failed: ' + err.message);
    throw err;
  }
};

module.exports = seed;
