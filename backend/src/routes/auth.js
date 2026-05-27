const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
];

router.post('/register', validateRegister, register);
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
