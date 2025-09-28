"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const auth_1 = __importDefault(require("./routes/auth"));
const notes_1 = __importDefault(require("./routes/notes"));
const user_1 = __importDefault(require("./routes/user"));
const errorHandler_1 = require("./middleware/errorHandler");
const passport_2 = require("./config/passport");
dotenv_1.default.config(); // ✅ Must be first to load env variables
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true // ✅ Needed for cookies/session
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use(limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Session middleware (must be before passport.session)
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Passport middleware
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
(0, passport_2.initializePassport)(passport_1.default); // ✅ Pass passport instance
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/notes', notes_1.default);
app.use('/api/user', user_1.default);
// Health check
app.get('/api/health', (_, res) => {
    res.json({ status: 'OK', message: 'Highway Notes API is running' });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (_, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Database connection + server start
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/highway-notes')
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map