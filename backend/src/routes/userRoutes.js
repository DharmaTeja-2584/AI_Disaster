const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUserRole,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate);

// User administration is strictly for Admin role
router.get('/users', authorize('admin'), getUsers);
router.get('/users/:id', authorize('admin'), getUserById);
router.post('/users', authorize('admin'), createUser);
router.patch('/users/:id/role', authorize('admin'), updateUserRole);

module.exports = router;
