import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();
    
    const email = 'manan.aws0404@gmail.com';
    const password = 'MANAN$0404';
    const name = 'Manan Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('Admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();
