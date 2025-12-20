/**
 * Script kiểm tra user role trong MongoDB
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUserRole() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@workflow.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('\n📋 Admin User Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', adminUser._id);
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role || 'NOT SET ❌');
    console.log('Is Active:', adminUser.isActive);
    console.log('Created At:', adminUser.createdAt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!adminUser.role || adminUser.role !== 'admin') {
      console.log('\n⚠️  Problem found: User role is NOT "admin"');
      console.log('🔧 Fixing...');
      
      await usersCollection.updateOne(
        { email: 'admin@workflow.com' },
        { 
          $set: { 
            role: 'admin',
            isActive: true 
          } 
        }
      );
      
      console.log('✅ Role updated to "admin"');
      
      // Verify
      const updatedUser = await usersCollection.findOne({ email: 'admin@workflow.com' });
      console.log('\n✅ Verified - Role is now:', updatedUser.role);
    } else {
      console.log('\n✅ User role is correct: admin');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

checkUserRole();
