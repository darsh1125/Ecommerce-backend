import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Create user and explicitly set role to customer to ignore client-supplied roles
    const newUser = new User({
      name,
      email,
      password,
      role: 'customer',
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
