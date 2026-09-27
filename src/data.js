const today = new Date();
const at = (daysAgo, hour = 9) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const sampleWorkouts = [
  { _id: 'demo-1', exercise: 'Upper body strength', category: 'Strength', date: at(0, 8), sets: 5, reps: 8, weight: 42.5, duration: 48, notes: 'Felt strong today' },
  { _id: 'demo-2', exercise: 'Easy morning run', category: 'Cardio', date: at(1, 7), sets: 1, reps: 1, weight: 0, duration: 32, notes: 'Easy pace, sunny out' },
  { _id: 'demo-3', exercise: 'Lower body strength', category: 'Strength', date: at(2, 17), sets: 4, reps: 10, weight: 60, duration: 55, notes: '' },
  { _id: 'demo-4', exercise: 'Mobility flow', category: 'Mobility', date: at(3, 9), sets: 1, reps: 1, weight: 0, duration: 20, notes: 'Hips and shoulders' },
  { _id: 'demo-5', exercise: 'Full body strength', category: 'Strength', date: at(5, 18), sets: 4, reps: 8, weight: 35, duration: 51, notes: '' },
];

export const readSaved = () => {
  try { return JSON.parse(localStorage.getItem('tempo-workouts') || 'null'); } catch { return null; }
};
export const saveLocal = (items) => localStorage.setItem('tempo-workouts', JSON.stringify(items));
