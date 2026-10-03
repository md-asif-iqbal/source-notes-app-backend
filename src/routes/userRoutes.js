const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByInterestsAggregation,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// Authenticated users can view interest groupings
router.get('/group-by-interests', protect, getUsersByInterestsAggregation);

// User profile by id (self or admin)
router.get('/:id', protect, getUserById);

// Admin-only management endpoints
router.use(protect, authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
