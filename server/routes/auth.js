import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const sessionCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const databaseReady = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Connect MongoDB to enable accounts. Set MONGODB_URI in your .env file and restart the server.' });
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Sign-in is not configured. Add JWT_SECRET to your .env file and restart the server.' });
  next();
};
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

router.post('/register', databaseReady, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (name.length < 2 || name.length > 50) return res.status(400).json({ message: 'Enter a name between 2 and 50 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Your password must be at least 8 characters.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('liftLogSession', token, sessionCookie).status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    next(error);
  }
});

router.post('/login', databaseReady, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('liftLogSession', token, sessionCookie).json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', databaseReady, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('liftLogSession', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ message: 'Signed out.' });
});

export default router;
