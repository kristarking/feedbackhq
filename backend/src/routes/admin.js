const router = require('express').Router();
const { getStats, getAllUsers, deleteReview } = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
