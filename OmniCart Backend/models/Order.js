const mongoose = require('mongoose');

const trackingStepSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  comment: {
    type: String,
    default: '',
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user'],
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'Order must have at least one item',
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  status: {
    type: String,
    enum: ['processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'],
    default: 'processing',
  },
  steps: {
    type: [trackingStepSchema],
    default: [],
  },
  etaBusinessDays: {
    type: Number,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate initial tracking steps
orderSchema.methods.generateTrackingSteps = function() {
  const baseTime = this.createdAt.getTime();
  const hour = 1000 * 60 * 60;
  
  this.steps = [
    { label: 'Processing', timestamp: new Date(baseTime + 1 * hour) },
    { label: 'Packed', timestamp: new Date(baseTime + 8 * hour) },
    { label: 'Shipped', timestamp: new Date(baseTime + 24 * hour) },
    { label: 'Out for Delivery', timestamp: new Date(baseTime + 96 * hour) },
  ];
};

module.exports = mongoose.model('Order', orderSchema);

