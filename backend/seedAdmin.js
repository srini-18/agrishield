require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Check if admin already exists
    let adminOpts = await User.findOne({ email: 'admin@agrishield.com' });
    if (adminOpts) {
      console.log('Admin user already exists!');
      process.exit();
    }

    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@agrishield.com',
      password: 'AdminPassword123!',
      phone: '9999999999',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@agrishield.com');
    console.log('Password: AdminPassword123!');
    console.log('You can now log in using these credentials.');

    process.exit();
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
};

seedAdmin();
