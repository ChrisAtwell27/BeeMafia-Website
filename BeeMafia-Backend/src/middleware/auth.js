/**
 * Authentication Middleware
 * Supports both authenticated users (with JWT) and simple mode (username only)
 */

const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Socket.io authentication middleware - supports both modes
const authenticateSocket = async (socket, next) => {
    try {
        const username = socket.handshake.auth.username;
        const token = socket.handshake.auth.token;

        // Validate username
        if (!username || username.trim().length < 3) {
            return next(new Error('Username must be at least 3 characters'));
        }

        if (username.length > 20) {
            return next(new Error('Username must be less than 20 characters'));
        }

        socket.username = username.trim();

        // If token provided, verify and use authenticated user
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
                const user = await User.findById(decoded.userId);

                if (user) {
                    socket.userId = user._id.toString();
                    socket.isAuthenticated = true;
                    socket.customRoles = user.customRoles || [];
                    return next();
                }
            } catch (error) {
                // Token invalid, fall back to simple mode
                console.log('Invalid token, using simple mode');
            }
        }

        // Simple mode - generate temporary ID
        socket.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        socket.isAuthenticated = false;
        socket.customRoles = [];

        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
};

// HTTP routes authentication - requires JWT
const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        req.userId = decoded.userId;
        req.username = decoded.username;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticate, authenticateSocket };
