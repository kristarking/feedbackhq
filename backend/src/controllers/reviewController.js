const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../config/logger');

const include = [
  { model: User, as: 'author', attributes: ['id', 'name'] },
  { model: Product, as: 'product', attributes: ['id', 'name', 'category'] },
];

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId, rating } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (rating) where.rating = parseInt(rating);
    const { rows: reviews, count } = await Review.findAndCountAll({
      where, include,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ reviews, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    logger.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

const getOne = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id, { include });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
};

const create = async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const existing = await Review.findOne({ where: { userId: req.user.id, productId } });
    if (existing) return res.status(409).json({ error: 'You already reviewed this product' });
    const review = await Review.create({ userId: req.user.id, productId, rating, title, body });
    const full = await Review.findByPk(review.id, { include });
    res.status(201).json(full);
  } catch (err) {
    logger.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

const update = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await review.update(req.body);
    const full = await Review.findByPk(review.id, { include });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
};

const remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await review.destroy();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
