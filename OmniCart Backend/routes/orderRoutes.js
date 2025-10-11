const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getMyOrders,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getOrders)
  .post(protect, authorize('customer', 'manager'), createOrder);

router.get('/user/me', protect, authorize('customer', 'manager'), getMyOrders);

router.route('/:id')
  .get(protect, getOrder)
  .delete(protect, authorize('super-admin'), deleteOrder);

router.put('/:id/status', protect, authorize('manager', 'super-admin'), updateOrderStatus);

module.exports = router;

