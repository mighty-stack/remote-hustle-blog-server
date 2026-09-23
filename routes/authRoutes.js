import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user._id),
    });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  })
);

router.post(
  '/register',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, email, password, role, bio } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email and password are required');
    }
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    const user = await User.create({ name, email, password, role: role || 'editor', bio: bio || '' });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user._id),
    });
  })
);

router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.name = req.body.name || user.name;
    user.bio = req.body.bio ?? user.bio;
    user.avatar = req.body.avatar ?? user.avatar;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      bio: updated.bio,
      avatar: updated.avatar,
    });
  })
);

router.get(
  '/users',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  })
);

router.delete(
  '/users/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        res.status(400);
        throw new Error('Cannot delete the last admin');
      }
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  })
);

export default router;
