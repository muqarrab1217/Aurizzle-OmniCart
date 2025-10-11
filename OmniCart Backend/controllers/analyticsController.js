const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get platform analytics
// @route   GET /api/analytics/platform
// @access  Private (Super Admin only)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalShops = await Shop.countDocuments();
    const pendingShops = await Shop.countDocuments({ status: 'pending' });
    const approvedShops = await Shop.countDocuments({ status: 'approved' });

    // Calculate total revenue
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.subtotal, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: {
        users: {
          totalCustomers,
          totalManagers,
          total: totalCustomers + totalManagers,
        },
        orders: {
          total: totalOrders,
          totalRevenue,
          avgOrderValue,
        },
        products: {
          total: totalProducts,
        },
        shops: {
          total: totalShops,
          pending: pendingShops,
          approved: approvedShops,
        },
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get daily user registrations
// @route   GET /api/analytics/users/daily
// @access  Private (Super Admin only)
exports.getDailyUserRegistrations = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default 30 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await User.find({
      createdAt: { $gte: startDate }
    }).select('createdAt role');

    // Group by date
    const dailyStats = {};
    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, count: 0, customers: 0, managers: 0 };
      }
      dailyStats[date].count++;
      if (user.role === 'customer') dailyStats[date].customers++;
      if (user.role === 'manager') dailyStats[date].managers++;
    });

    // Convert to array and sort by date
    const data = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get daily shop registrations
// @route   GET /api/analytics/shops/daily
// @access  Private (Super Admin only)
exports.getDailyShopRegistrations = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default 30 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const shops = await Shop.find({
      createdAt: { $gte: startDate }
    }).select('createdAt status');

    // Group by date
    const dailyStats = {};
    shops.forEach(shop => {
      const date = new Date(shop.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, count: 0, pending: 0, approved: 0, rejected: 0 };
      }
      dailyStats[date].count++;
      if (shop.status === 'pending') dailyStats[date].pending++;
      if (shop.status === 'approved') dailyStats[date].approved++;
      if (shop.status === 'rejected') dailyStats[date].rejected++;
    });

    // Convert to array and sort by date
    const data = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get shop-specific analytics
// @route   GET /api/analytics/shops/:id
// @access  Private (Super Admin or Shop Manager)
exports.getShopAnalytics = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('ownerId', 'name email phone cnic profilePhoto');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    // Get shop products
    const products = await Product.find({ shopId: shop._id });

    // Get shop orders
    const orders = await Order.find({
      'items.shopId': shop._id
    }).populate('userId', 'name email');

    // Calculate shop revenue
    let shopRevenue = 0;
    let shopOrderCount = 0;
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.shopId.toString() === shop._id.toString()) {
          shopRevenue += item.priceAtPurchase * item.quantity;
          shopOrderCount++;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        shop: {
          id: shop._id,
          name: shop.name,
          ownerName: shop.ownerName,
          email: shop.email,
          phone: shop.phone,
          address: shop.address,
          status: shop.status,
          createdAt: shop.createdAt,
          approvedAt: shop.approvedAt,
        },
        owner: shop.ownerId,
        products: {
          total: products.length,
          list: products,
        },
        orders: {
          total: orders.length,
          itemsSold: shopOrderCount,
        },
        revenue: {
          total: shopRevenue,
          avgOrderValue: orders.length > 0 ? shopRevenue / orders.length : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

