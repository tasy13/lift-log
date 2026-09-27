import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'node:path';
import workoutsRouter from './routes/workouts.js';
import authRouter from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve('dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
app.use(errorHandler);

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => { console.log('Connected to MongoDB'); start(); })
    .catch((error) => { console.error('MongoDB connection failed:', error.message); start(); });
} else {
  console.warn('MONGODB_URI is not set. Add it to .env to enable database storage.');
}

const start = () => app.listen(port, '0.0.0.0', () => console.log(`Tempo API listening on http://localhost:${port}`));

if (!process.env.MONGODB_URI) start();
