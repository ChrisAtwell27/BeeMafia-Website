/**
 * BeeMafia Backend Server
 * Main server file with Express and Socket.io setup
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initializeSocketHandlers } = require('./socket/socketHandler');

// Optional: MongoDB for stats (not required for gameplay)
let connectDB;
try {
    connectDB = require('./config/database');
} catch (err) {
    console.warn('MongoDB module not found - running without database');
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Optional: Connect to MongoDB for stats (not required for gameplay)
if (connectDB && process.env.MONGODB_URI) {
    connectDB().catch(err => {
        console.warn('⚠️  MongoDB not connected - game will run without stats tracking');
    });
} else {
    console.log('ℹ️  Running without database (MongoDB not configured)');
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Make io available to routes
app.set('io', io);

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'BeeMafia API Server',
        version: '1.0.0',
        status: 'online',
        mode: 'Simple (No Accounts Required)'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Announcement routes
const announcementRoutes = require('./routes/announcements');
app.use('/api/announcements', announcementRoutes);

// Socket.io connection handling
initializeSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🐝 BeeMafia server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Mode: Simple (No Accounts Required)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io };
