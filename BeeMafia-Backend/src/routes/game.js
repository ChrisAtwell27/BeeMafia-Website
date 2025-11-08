/**
 * Game Routes
 * Handles game-related HTTP endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Game = require('../../models/Game');
const User = require('../../models/User');

// Get user's game history
router.get('/history', authenticate, async (req, res) => {
    try {
        const games = await Game.find({
            'players.userId': req.userId
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('-__v');

        res.json({ games });
    } catch (error) {
        console.error('Game history error:', error);
        res.status(500).json({ error: 'Error fetching game history' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .sort({ 'stats.gamesWon': -1 })
            .limit(100)
            .select('username displayName avatar stats');

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            gamesPlayed: user.stats.gamesPlayed,
            gamesWon: user.stats.gamesWon,
            winRate: user.stats.gamesPlayed > 0
                ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
                : '0.0'
        }));

        res.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
});

// Get game stats
router.get('/stats', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const recentGames = await Game.find({
            'players.userId': req.userId
        })
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({
            stats: user.stats,
            recentGames: recentGames.map(game => ({
                gameId: game.gameId,
                winner: game.winner,
                duration: game.duration,
                endedAt: game.endedAt,
                playerRole: game.players.find(p => p.userId.toString() === req.userId).role,
                won: game.players.find(p => p.userId.toString() === req.userId).won
            }))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

module.exports = router;
