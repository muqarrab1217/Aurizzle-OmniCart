const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByShop,
  uploadProductImage,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const uploadProduct = require('../middleware/uploadProduct');

const router = express.Router();

// Upload product image
router.post('/upload-image', protect, authorize('manager', 'super-admin'), uploadProduct.single('image'), uploadProductImage);

router.route('/')
  .get(getProducts)
  .post(protect, authorize('manager', 'super-admin'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('manager', 'super-admin'), updateProduct)
  .delete(protect, authorize('manager', 'super-admin'), deleteProduct);

// Get products by shop
router.get('/shop/:shopId', getProductsByShop);

module.exports = router;

