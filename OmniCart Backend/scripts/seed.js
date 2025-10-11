const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    console.log('📦 Clearing existing data...');
    await User.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Create Shops
    console.log('🏪 Creating shops...');
    const shops = await Shop.insertMany([
      {
        name: 'Audio Hub',
        ownerName: 'Ava Carter',
        email: 'ava@audiohub.com',
        phone: '+1 (555) 123-4567',
        address: '123 Sound Street, Music City, MC 12345',
        createdAt: new Date('2024-01-15'),
        totalRevenue: 0,
      },
      {
        name: 'Wearables Co.',
        ownerName: 'Liam Patel',
        email: 'liam@wearablesco.com',
        phone: '+1 (555) 234-5678',
        address: '456 Tech Avenue, Innovation District, ID 67890',
        createdAt: new Date('2024-02-20'),
        totalRevenue: 0,
      },
      {
        name: 'Adventure Cams',
        ownerName: 'Noah Kim',
        email: 'noah@adventurecams.com',
        phone: '+1 (555) 345-6789',
        address: '789 Adventure Lane, Outdoor City, OC 13579',
        createdAt: new Date('2024-03-10'),
        totalRevenue: 0,
      },
    ]);
    console.log(`✅ Created ${shops.length} shops\n`);

    // Create Users
    console.log('👥 Creating users...');
    const salt = await bcrypt.genSalt(10);
    
    const users = await User.insertMany([
      {
        name: 'John Customer',
        email: 'customer@example.com',
        password: await bcrypt.hash('password123', salt),
        role: 'customer',
      },
      {
        name: 'Ava Carter',
        email: 'ava@audiohub.com',
        password: await bcrypt.hash('password123', salt),
        role: 'manager',
        shopId: shops[0]._id,
      },
      {
        name: 'Liam Patel',
        email: 'liam@wearablesco.com',
        password: await bcrypt.hash('password123', salt),
        role: 'manager',
        shopId: shops[1]._id,
      },
      {
        name: 'Noah Kim',
        email: 'noah@adventurecams.com',
        password: await bcrypt.hash('password123', salt),
        role: 'manager',
        shopId: shops[2]._id,
      },
      {
        name: 'Super Admin',
        email: 'admin@omnicart.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'super-admin',
      },
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // Create Products
    console.log('📦 Creating products...');
    const products = await Product.insertMany([
      {
        title: 'Wireless Headphones',
        description: 'Noise-cancelling over-ear headphones with 30h battery.',
        price: 129.99,
        image: '/wireless-headphones.png',
        rating: 4.6,
        tags: ['audio', 'wireless'],
        shopId: shops[0]._id,
      },
      {
        title: 'Smartwatch Pro',
        description: 'Track fitness, sleep, and notifications with style.',
        price: 199.0,
        image: '/smartwatch-wearable-product.jpg',
        rating: 4.4,
        tags: ['wearable', 'fitness'],
        shopId: shops[1]._id,
      },
      {
        title: 'Portable Speaker',
        description: 'Rich sound in a compact, water-resistant design.',
        price: 79.5,
        image: '/portable-speaker.png',
        rating: 4.5,
        tags: ['audio', 'portable'],
        shopId: shops[0]._id,
      },
      {
        title: '4K Action Cam',
        description: 'Capture every adventure in stunning detail.',
        price: 249.0,
        image: '/4k-action-camera-product.jpg',
        rating: 4.2,
        tags: ['camera', 'outdoor'],
        shopId: shops[2]._id,
      },
    ]);
    console.log(`✅ Created ${products.length} products\n`);

    // Create Sample Order
    console.log('📋 Creating sample order...');
    const sampleOrder = new Order({
      userId: users[0]._id, // John Customer
      items: [
        {
          productId: products[0]._id,
          quantity: 1,
          priceAtPurchase: products[0].price,
          shopId: products[0].shopId,
          comment: 'Gift wrap please',
        },
        {
          productId: products[2]._id,
          quantity: 2,
          priceAtPurchase: products[2].price,
          shopId: products[2].shopId,
        },
      ],
      subtotal: products[0].price + (products[2].price * 2),
      status: 'processing',
      etaBusinessDays: 5,
    });
    
    sampleOrder.generateTrackingSteps();
    await sampleOrder.save();
    console.log(`✅ Created 1 sample order\n`);

    console.log('═══════════════════════════════════════════════════');
    console.log('✨ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   Shops: ${shops.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: 1\n`);
    
    console.log('🔑 Test Credentials:');
    console.log('   Customer:');
    console.log('     Email: customer@example.com');
    console.log('     Password: password123\n');
    console.log('   Manager (Audio Hub):');
    console.log('     Email: ava@audiohub.com');
    console.log('     Password: password123\n');
    console.log('   Manager (Wearables Co.):');
    console.log('     Email: liam@wearablesco.com');
    console.log('     Password: password123\n');
    console.log('   Manager (Adventure Cams):');
    console.log('     Email: noah@adventurecams.com');
    console.log('     Password: password123\n');
    console.log('   Super Admin:');
    console.log('     Email: admin@omnicart.com');
    console.log('     Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

