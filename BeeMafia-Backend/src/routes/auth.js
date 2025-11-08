/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { authenticate } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: existingUser.username === username ? 'Username already taken' : 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: user.getPublicProfile() });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { displayName, avatar } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (displayName) user.displayName = displayName;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

module.exports = router;
