import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';

export const initializePassport = () => {
  // Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in .env');
  }

  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (payload, done) => {
    try {
      const user = await User.findById(payload.userId || payload.id).select('-password -otp');
      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails?.[0]?.value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            isEmailVerified: true
          });
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Serialize/Deserialize
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id).select('-password -otp');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
