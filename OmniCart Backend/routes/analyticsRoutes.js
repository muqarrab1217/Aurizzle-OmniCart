const express = require('express');
const {
  getPlatformAnalytics,
  getDailyUserRegistrations,
  getDailyShopRegistrations,
  getShopAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/platform', protect, authorize('super-admin'), getPlatformAnalytics);
router.get('/users/daily', protect, authorize('super-admin'), getDailyUserRegistrations);
router.get('/shops/daily', protect, authorize('super-admin'), getDailyShopRegistrations);
router.get('/shops/:id', protect, authorize('super-admin', 'manager'), getShopAnalytics);

module.exports = router;

