import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';

import authRoutes from './routes/auth';
import noteRoutes from './routes/notes';
import userRoutes from './routes/user';
import { errorHandler } from './middleware/errorHandler';
import { initializePassport } from './config/passport';

dotenv.config(); // Load env variables first

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS middleware (must be before routes)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://highway-frontend-6n97.vercel.app/signin'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Preflight handling for complex requests
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware (must be before passport.session)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport); // Pass passport instance

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'OK', message: 'Highway Notes API is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (_, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection + server start
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/highway-notes')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
