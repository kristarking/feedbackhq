const { fn, col } = require('sequelize');
const User = require('../models/User');
const Review = require('../models/Review');
const Product = require('../models/Product');

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalReviews, totalProducts, avgRating] = await Promise.all([
      User.count(),
      Review.count(),
      Product.count(),
      Review.findOne({ attributes: [[fn('AVG', col('rating')), 'avg']], raw: true }),
    ]);
    res.json({
      totalUsers,
      totalReviews,
      totalProducts,
      avgRating: parseFloat(avgRating && avgRating.avg ? avgRating.avg : 0).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    await review.destroy();
    res.json({ message: 'Review removed by admin' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = { getStats, getAllUsers, deleteReview };
