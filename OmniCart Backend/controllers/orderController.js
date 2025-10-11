const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// @desc    Get all orders (for super-admin or manager's shop orders)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    let query = {};

    // If user is a customer, show only their orders
    if (req.user.role === 'customer') {
      query.userId = req.user._id;
    }
    
    // If user is a manager, show orders containing their shop's products
    if (req.user.role === 'manager') {
      query['items.shopId'] = req.user.shopId;
    }
    
    // Super-admin can see all orders

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId', 'title image')
      .populate('items.shopId', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title image description')
      .populate('items.shopId', 'name ownerName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    // If manager, check if they own any shop in the order
    if (req.user.role === 'manager') {
      const hasShopItem = order.items.some(
        item => item.shopId._id.toString() === req.user.shopId.toString()
      );
      if (!hasShopItem) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    // Validate all products exist and get current prices
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        shopId: product.shopId,
        comment: item.comment || '',
      });
    }

    // Create order
    const order = new Order({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      status: 'processing',
      etaBusinessDays: 5,
    });

    // Generate tracking steps
    order.generateTrackingSteps();
    
    await order.save();

    // Update shop revenues
    const shopRevenues = {};
    orderItems.forEach(item => {
      const shopIdStr = item.shopId.toString();
      shopRevenues[shopIdStr] = (shopRevenues[shopIdStr] || 0) + (item.priceAtPurchase * item.quantity);
    });

    for (const [shopId, revenue] of Object.entries(shopRevenues)) {
      await Shop.findByIdAndUpdate(shopId, {
        $inc: { totalRevenue: revenue }
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title image')
      .populate('items.shopId', 'name');

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Manager or Super Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // If manager, check if they own any shop in the order
    if (req.user.role === 'manager') {
      const hasShopItem = order.items.some(
        item => item.shopId.toString() === req.user.shopId.toString()
      );
      if (!hasShopItem) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order',
        });
      }
    }

    order.status = status;
    await order.save();

    order = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('items.productId', 'title image')
      .populate('items.shopId', 'name');

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/user/me
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.productId', 'title image')
      .populate('items.shopId', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Super Admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    await order.deleteOne();

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

