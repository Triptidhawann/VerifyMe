require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/verifyme';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@verifyme.local';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`Admin user ${ADMIN_EMAIL} already exists`);
      process.exit(0);
    }

    const adminUser = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log(`Admin user created: ${adminUser.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error creating admin: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
