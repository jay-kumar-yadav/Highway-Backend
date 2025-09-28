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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// -------------------- Security --------------------
app.use(helmet());

// -------------------- CORS --------------------
const allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL,
  process.env.FRONTEND_URL_PROD
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // respond OK to preflight
  }
  next();
});

// -------------------- Rate Limiting --------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// -------------------- Body Parsing --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------- Session --------------------
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// -------------------- Passport --------------------
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);

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
app.use('*', (_, res) => res.status(404).json({ message: 'Route not found' }));

// -------------------- DB Connection --------------------
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
