const Shop = require('../models/Shop');

// Check if manager's shop is approved
exports.requireApprovedShop = async (req, res, next) => {
  // Super-admin can access regardless
  if (req.user.role === 'super-admin') {
    return next();
  }

  // Managers must have approved shop
  if (req.user.role === 'manager') {
    if (!req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: 'No shop assigned to your account',
      });
    }

    const shop = await Shop.findById(req.user.shopId);
    
    if (!shop) {
      return res.status(403).json({
        success: false,
        message: 'Shop not found',
      });
    }

    if (shop.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Your shop is ${shop.status}. You can only manage products and orders after admin approval.`,
      });
    }
  }

  next();
};

