import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export default function requireAuth(req, res, next) {
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Sign-in is not configured. Add JWT_SECRET to the server environment.' });
  const token = req.cookies?.liftLogSession;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.isValidObjectId(payload.sub)) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = { id: payload.sub };
    next();
  } catch {
    res.clearCookie('liftLogSession', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
