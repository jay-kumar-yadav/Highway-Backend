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
const PORT = process.env.PORT || 5004;

// -------------------- Security Middleware --------------------
app.use(helmet());

// -------------------- CORS Middleware --------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://highway-frontend-6n97.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// -------------------- Rate Limiting --------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// -------------------- Body Parsing --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------- Session Middleware --------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// -------------------- Passport --------------------
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport); // Pass the passport instance

// -------------------- Routes --------------------
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'OK', message: 'Highway Notes API is running' });
});

// -------------------- Error Handling --------------------
app.use(errorHandler);

// 404 Handler
app.use('*', (_, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// -------------------- Database Connection --------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/highway-notes')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
