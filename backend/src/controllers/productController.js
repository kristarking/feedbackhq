const { fn, col, literal } = require('sequelize');
const Product = require('../models/Product');
const Review = require('../models/Review');
const logger = require('../config/logger');

const getAll = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: {
        include: [
          [fn('AVG', col('reviews.rating')), 'avgRating'],
          [fn('COUNT', col('reviews.id')), 'reviewCount'],
        ],
      },
      include: [{ model: Review, as: 'reviews', attributes: [] }],
      group: ['Product.id'],
      order: [[literal('reviewCount'), 'DESC']],
    });
    res.json(products);
  } catch (err) {
    logger.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

module.exports = { getAll, getOne };
