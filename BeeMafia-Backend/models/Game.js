/**
 * Game Model
 * Schema for storing completed games (for stats and history)
 */

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameId: {
        type: String,
        required: true,
        unique: true
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    players: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        role: String,
        team: String,
        survived: Boolean,
        won: Boolean
    }],
    gameMode: {
        type: String,
        enum: ['basic', 'chaos', 'investigative', 'killing', 'custom'],
        default: 'basic'
    },
    winner: {
        type: String,
        enum: ['bees', 'wasps', 'neutral_killer', 'jester', 'executioner'],
        required: true
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    nightsCompleted: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        required: true
    },
    endedAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
gameSchema.index({ organizerId: 1, createdAt: -1 });
gameSchema.index({ 'players.userId': 1 });

module.exports = mongoose.model('Game', gameSchema);
