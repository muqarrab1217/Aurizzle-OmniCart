const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI in your environment.');
    }

    const conn = await mongoose.connect(uri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error:`);
    console.error(`   ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Check your MongoDB credentials in .env file');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Check your MongoDB connection string in .env file');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Make sure your IP is whitelisted in MongoDB Atlas Network Access');
    } else if (error.message.includes('connection string is missing')) {
      console.error('\n💡 Add MONGO_URI or MONGODB_URI to your environment configuration.');
    }
    
    console.error('\n📖 For MongoDB Atlas setup guide, see: MONGODB_ATLAS_SETUP.md\n');
    process.exit(1);
  }
};

module.exports = connectDB;

