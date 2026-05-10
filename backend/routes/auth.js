const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateTokenAndSetCookie = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash });

    if (user) {
      generateTokenAndSetCookie(res, user._id);
      res.status(201).json({ _id: user.id, email: user.email });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      generateTokenAndSetCookie(res, user._id);
      res.json({ _id: user.id, email: user.email });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', protect, (req, res) => {
  res.json({ _id: req.user.id, email: req.user.email });
});

module.exports = router;
