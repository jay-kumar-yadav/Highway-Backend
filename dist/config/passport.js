"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User"));
const initializePassport = () => {
    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in .env');
    }
    // JWT Strategy
    passport_1.default.use(new passport_jwt_1.Strategy({
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    }, async (payload, done) => {
        try {
            const user = await User_1.default.findById(payload.userId || payload.id).select('-password -otp');
            if (user)
                return done(null, user);
            return done(null, false);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    // Google OAuth Strategy
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User_1.default.findOne({ googleId: profile.id });
            if (!user) {
                user = await User_1.default.findOne({ email: profile.emails?.[0]?.value });
                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                }
                else {
                    user = await User_1.default.create({
                        googleId: profile.id,
                        email: profile.emails?.[0]?.value,
                        name: profile.displayName,
                        isEmailVerified: true
                    });
                }
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, null);
        }
    }));
    // Serialize/Deserialize
    passport_1.default.serializeUser((user, done) => {
        done(null, user._id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await User_1.default.findById(id).select('-password -otp');
            done(null, user);
        }
        catch (error) {
            done(error, null);
        }
    });
};
exports.initializePassport = initializePassport;
//# sourceMappingURL=passport.js.map