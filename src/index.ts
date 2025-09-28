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
// ✅ allow only your dev and prod frontend
const allowedOrigins = [
  'http://localhost:5173',                         // Vite dev
  'https://highway-frontend-ivory.vercel.app'      // your live Vercel domain
];

console.log('🌐 Allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow curl / Postman with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('❌ CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  })
);

// Enable OPTIONS for all routes
app.options('*', cors());

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
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

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

// -------------------
