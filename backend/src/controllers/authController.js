const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES = '24h';

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    logger.info('New user registered: ' + email);
    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    await redis.setex('session:' + user.id, 86400, JSON.stringify({ id: user.id, role: user.role })).catch(() => {});
    logger.info('User logged in: ' + email);
    res.json({ token, user });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  try {
    await redis.setex('blacklist:' + req.token, 86400, '1').catch(() => {});
    await redis.del('session:' + req.user.id).catch(() => {});
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

const me = (req, res) => res.json(req.user);

module.exports = { register, login, logout, me };
