import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';

export class UserService {
  // 1. Naya user create karne ke liye
  static async createUser(email, password) {
    // Check agar user pehle se exist karta hai
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Password ko secure tareeqe se hash karein
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Database mein save karein
    const newUser = new User({
      email,
      password: hashedPassword
    });

    return await newUser.save();
  }

  // 2. Login ke waqt credentials check karne ke liye
  static async validateCredentials(email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;

    // Database wale hashed password se compare karein
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  static async findById(id) {
    return await User.findById(id).select('-password'); // Password ke bagair data return karein
  }
}