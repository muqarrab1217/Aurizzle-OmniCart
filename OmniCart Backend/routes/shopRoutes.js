const express = require('express');
const {
  getShops,
  getShop,
  createShop,
  updateShop,
  deleteShop,
  getShopRevenue,
  registerShop,
  updateShopStatus,
} = require('../controllers/shopController');
const { protect, authorize, checkShopOwnership } = require('../middleware/auth');

const router = express.Router();

// Customer shop registration (different from admin shop creation)
router.post('/register', protect, authorize('customer'), registerShop);

// Update shop status (approve/reject)
router.put('/:id/status', protect, authorize('super-admin'), updateShopStatus);

router.route('/')
  .get(getShops)
  .post(protect, authorize('super-admin'), createShop);

router.route('/:id')
  .get(getShop)
  .put(protect, authorize('manager', 'super-admin'), updateShop)
  .delete(protect, authorize('super-admin'), deleteShop);

router.get('/:id/revenue', protect, authorize('manager', 'super-admin'), getShopRevenue);

module.exports = router;

