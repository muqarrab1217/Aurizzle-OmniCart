const Product = require('../models/Product');
const Shop = require('../models/Shop');
const path = require('path');
const fs = require('fs');
const { syncProductsJson, syncShopsJson } = require('../services/dataSyncService');
const { refreshKnowledgeBase } = require('../services/ragService');

async function refreshProductKnowledge() {
  try {
    const productsPayload = await syncProductsJson();
    await syncShopsJson(productsPayload);
    await refreshKnowledgeBase();
  } catch (error) {
    console.error('⚠️  Failed to refresh product knowledge data:', error.message);
  }
}

// @desc    Upload product image
// @route   POST /api/products/upload-image
// @access  Private (Manager or Super Admin)
exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Return the image path
    const imagePath = `/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        imagePath,
      },
      message: 'Product image uploaded successfully',
    });
  } catch (error) {
    // If error occurs, delete uploaded file
    if (req.file) {
      const filePath = path.join(__dirname, '../public/uploads/products', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { shopId, tags, minPrice, maxPrice, search } = req.query;
    
    let query = {};
    
    // Filter by shop
    if (shopId) {
      query.shopId = shopId;
    }
    
    // Filter by tags
    if (tags) {
      const tagsArray = tags.split(',');
      query.tags = { $in: tagsArray };
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    const products = await Product.find(query)
      .populate('shopId', 'name ownerName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shopId');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Manager or Super Admin)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, image, rating, tags, shopId } = req.body;

    // If user is a manager, use their shopId
    let productShopId = shopId;
    if (req.user.role === 'manager') {
      productShopId = req.user.shopId;
    }

    // Verify shop exists
    const shop = await Shop.findById(productShopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const product = await Product.create({
      title,
      description,
      price,
      image,
      rating: rating || 0,
      tags: tags || [],
      shopId: productShopId,
    });

    const populatedProduct = await Product.findById(product._id).populate('shopId');

    res.status(201).json({
      success: true,
      data: populatedProduct,
    });

    refreshProductKnowledge().catch((err) =>
      console.error('⚠️  Deferred product knowledge refresh failed:', err.message)
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Manager of shop or Super Admin)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if manager owns the product's shop
    if (req.user.role === 'manager' && product.shopId.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('shopId');

    res.status(200).json({
      success: true,
      data: product,
    });

    refreshProductKnowledge().catch((err) =>
      console.error('⚠️  Deferred product knowledge refresh failed:', err.message)
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Manager of shop or Super Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if manager owns the product's shop
    if (req.user.role === 'manager' && product.shopId.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });

    refreshProductKnowledge().catch((err) =>
      console.error('⚠️  Deferred product knowledge refresh failed:', err.message)
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get products by shop
// @route   GET /api/shops/:shopId/products
// @access  Public
exports.getProductsByShop = async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.shopId })
      .populate('shopId', 'name ownerName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

