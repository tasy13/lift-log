export default function errorHandler(error, _req, res, _next) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
  }
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
