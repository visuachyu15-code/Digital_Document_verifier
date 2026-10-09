const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All routes in this file are restricted to admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (admin)
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Change user role (admin only; cannot change own role)
 * @access  Private (admin)
 */
router.patch('/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;

    const validRoles = ['admin', 'verifier', 'user'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Protection rule: Admin cannot change their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Admins cannot change their own role',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user (admin only; cannot delete self)
 * @access  Private (admin)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    // Protection rule: Admin cannot delete their own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Admins cannot delete their own account',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
