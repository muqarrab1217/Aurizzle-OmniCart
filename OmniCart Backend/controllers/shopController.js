const Shop = require('../models/Shop');
const User = require('../models/User');

// @desc    Register shop for customer (customer becomes manager)
// @route   POST /api/shops/register
// @access  Private (Customer only)
exports.registerShop = async (req, res) => {
  try {
    const { name, ownerName, email, phone, address } = req.body;

    // Check if user already has a shop
    if (req.user.shopId) {
      return res.status(400).json({
        success: false,
        message: 'You already have a shop',
      });
    }

    // Validate user has complete profile
    if (!req.user.phone || !req.user.cnic || !req.user.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (phone, CNIC, and profile photo) before creating a shop',
      });
    }

    // Create shop with pending status
    const shop = await Shop.create({
      name,
      ownerName,
      email,
      phone,
      address,
      status: 'pending',
      ownerId: req.user.id,
    });

    // Assign shop to user (but keep as customer until approved)
    const user = await User.findById(req.user.id);
    user.shopId = shop._id;
    await user.save();

    res.status(201).json({
      success: true,
      data: shop,
      message: 'Shop registration submitted! Awaiting admin approval.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve or reject shop
// @route   PUT /api/shops/:id/status
// @access  Private (Super Admin only)
exports.updateShopStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: approved, rejected, or pending',
      });
    }

    const shop = await Shop.findById(req.params.id).populate('ownerId');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const updateData = { status };
    
    if (status === 'approved') {
      updateData.approvedAt = Date.now();
      
      // Upgrade shop owner to manager if ownerId exists
      if (shop.ownerId) {
        const owner = await User.findById(shop.ownerId);
        if (owner) {
          owner.role = 'manager';
          await owner.save();
        }
      }
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason || '';
    }

    // Use findByIdAndUpdate to bypass validation
    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      data: updatedShop,
      message: `Shop ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Public
exports.getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new shop
// @route   POST /api/shops
// @access  Private (Super Admin only)
exports.createShop = async (req, res) => {
  try {
    const { name, ownerName, email, phone, address } = req.body;

    const shop = await Shop.create({
      name,
      ownerName,
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (Manager of shop or Super Admin)
exports.updateShop = async (req, res) => {
  try {
    let shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (Super Admin only)
exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    await shop.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get shop revenue
// @route   GET /api/shops/:id/revenue
// @access  Private (Manager of shop or Super Admin)
exports.getShopRevenue = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        shopId: shop._id,
        shopName: shop.name,
        totalRevenue: shop.totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

