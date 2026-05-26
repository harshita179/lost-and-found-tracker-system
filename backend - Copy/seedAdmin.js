/**
 * Admin Seed Script
 * Run this ONCE to create the admin account: node seedAdmin.js
 * 
 * Default credentials (change via environment variables or edit below):
 *   Username: Arpit Deo
 *   Email:    arpit.deo@medicaps.ac.in
 *   Password: Arpit@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Arpit Deo';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'arpit.deo@medicaps.ac.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Arpit@123';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lostfound');
    console.log('Connected to MongoDB');

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.username} (${existingAdmin.email})`);
      console.log('No changes made.');
      process.exit(0);
    }

    // Check if the username or email is taken by a regular user
    const conflict = await User.findOne({ $or: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] });
    if (conflict) {
      console.error(`Username "${ADMIN_USERNAME}" or email "${ADMIN_EMAIL}" is already taken by a non-admin user.`);
      console.error('Please change the admin credentials and try again.');
      process.exit(1);
    }

    // Create admin user (password will be hashed by the User model pre-save hook)
    const admin = new User({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      emailVerified: true,
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: (the one you set)`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
