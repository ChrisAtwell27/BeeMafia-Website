/**
 * Simple Authentication Middleware
 * No accounts required - just username validation
 */

// Socket.io authentication middleware - just validate username
const authenticateSocket = (socket, next) => {
    try {
        const username = socket.handshake.auth.username;

        if (!username || username.trim().length < 3) {
            return next(new Error('Username must be at least 3 characters'));
        }

        if (username.length > 20) {
            return next(new Error('Username must be less than 20 characters'));
        }

        // Generate a simple session ID
        socket.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        socket.username = username.trim();

        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
};

// HTTP routes authentication (optional - for stats only)
const authenticate = (req, res, next) => {
    // Optional - only needed if you want to track stats
    // For now, just pass through
    next();
};

module.exports = { authenticate, authenticateSocket };
