const router = require('express').Router();
const { body } = require('express-validator');
const { getAll, getOne, create, update, remove } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('body').trim().isLength({ min: 10 }),
  body('productId').isUUID(),
];

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authenticate, validateReview, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
