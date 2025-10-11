// Quick test script to verify MONGO Atlas connection
require('dotenv').config();
const MONGOose = require('mongoose');

console.log('\n🔍 Testing MONGO Atlas Connection...\n');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in .env file');
  console.log('\n📝 Please create a .env file with your MONGO Atlas connection string');
  console.log('   See MONGO_ATLAS_SETUP.md for instructions\n');
  process.exit(1);
}

console.log('📡 Connection String:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

MONGOose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('\n✅ SUCCESS! Connected to MONGO Atlas');
  console.log(`📊 Database: ${MONGOose.connection.name}`);
  console.log(`🌐 Host: ${MONGOose.connection.host}\n`);
  console.log('🎉 Your backend is ready to run!');
  console.log('   Start it with: npm run dev\n');
  process.exit(0);
})
.catch((error) => {
  console.error('\n❌ Connection Failed:', error.message);
  
  if (error.message.includes('authentication failed')) {
    console.error('\n💡 Solution: Check your username and password in .env');
    console.error('   Make sure you\'re using the DATABASE USER credentials, not your Atlas login');
  } else if (error.message.includes('ENOTFOUND')) {
    console.error('\n💡 Solution: Check your MONGO connection string in .env');
    console.error('   Format: MONGO+srv://username:password@cluster.MONGO.net/dbname');
  } else if (error.message.includes('IP')) {
    console.error('\n💡 Solution: Whitelist your IP in MONGO Atlas');
    console.error('   1. Go to Network Access in Atlas');
    console.error('   2. Add IP Address');
    console.error('   3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development');
  } else if (error.message.includes('timed out')) {
    console.error('\n💡 Solution: Connection timed out');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify your cluster is running in Atlas');
    console.error('   3. Check firewall settings');
  }
  
  console.error('\n📖 For complete setup guide, see: MONGO_ATLAS_SETUP.md\n');
  process.exit(1);
});

