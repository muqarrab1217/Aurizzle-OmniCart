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

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

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
    }
    
    console.error('\n📖 For MongoDB Atlas setup guide, see: MONGODB_ATLAS_SETUP.md\n');
    process.exit(1);
  }
};

module.exports = connectDB;

