import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exercise: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, enum: ['Strength', 'Cardio', 'Mobility'], default: 'Strength' },
  date: { type: Date, required: true, default: Date.now },
  sets: { type: Number, min: 1, default: 3 },
  reps: { type: Number, min: 1, default: 10 },
  weight: { type: Number, min: 0, default: 0 },
  duration: { type: Number, min: 0, default: 0 },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

export default mongoose.model('Workout', workoutSchema);
