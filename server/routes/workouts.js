import { Router } from 'express';
import mongoose from 'mongoose';
import Workout from '../models/Workout.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const dbReady = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database is not connected. Set MONGODB_URI in .env.' });
  next();
};

router.use(dbReady, requireAuth);
router.get('/', async (req, res, next) => {
  try {
    const { from, to, category } = req.query;
    const filter = {};
    filter.userId = req.user.id;
    if (from || to) filter.date = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(`${to}T23:59:59.999Z`) }) };
    if (category && category !== 'All') filter.category = category;
    res.json(await Workout.find(filter).sort({ date: -1, createdAt: -1 }).lean());
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await Workout.create({ ...req.body, userId: req.user.id })); } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid workout id.' });
    const workout = await Workout.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true, runValidators: true });
    if (!workout) return res.status(404).json({ message: 'Workout not found.' });
    res.json(workout);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid workout id.' });
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!workout) return res.status(404).json({ message: 'Workout not found.' });
    res.json({ message: 'Workout deleted.' });
  } catch (error) { next(error); }
});

export default router;
