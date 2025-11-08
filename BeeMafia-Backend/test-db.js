/**
 * MongoDB Connection Test Script
 * Run this to verify your MongoDB connection is working
 *
 * Usage: node test-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...\n');

    try {
        // Attempt connection
        console.log('Connection URI:', process.env.MONGODB_URI ?
            process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') :
            'NOT SET IN .env');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beemafia');

        console.log('✅ MongoDB connected successfully!\n');
        console.log('📊 Connection Details:');
        console.log('   Database:', mongoose.connection.name);
        console.log('   Host:', mongoose.connection.host);
        console.log('   Port:', mongoose.connection.port);
        console.log('   Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections in database:');
        if (collections.length === 0) {
            console.log('   (No collections yet - will be created when you run the app)');
        } else {
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Test completed successfully!');
        console.log('🚀 You\'re ready to start the server!\n');

    } catch (error) {
        console.error('\n❌ MongoDB connection error:');
        console.error('   Message:', error.message);

        // Helpful error messages
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Tip: MongoDB is not running. Start it with:');
            console.error('   Windows: net start MongoDB');
            console.error('   Mac/Linux: sudo systemctl start mongod');
        } else if (error.message.includes('authentication failed')) {
            console.error('\n💡 Tip: Check your username and password in MONGODB_URI');
        } else if (error.message.includes('MONGODB_URI')) {
            console.error('\n💡 Tip: Make sure MONGODB_URI is set in backend/.env');
        }

        process.exit(1);
    }
}

// Run the test
testConnection();
