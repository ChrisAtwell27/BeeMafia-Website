/**
 * User Model
 * Schema for user accounts
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    displayName: {
        type: String,
        default: function() { return this.username; }
    },
    avatar: {
        type: String,
        default: null
    },
    discordId: {
        type: String,
        default: null,
        sparse: true,
        unique: true
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        gamesWon: { type: Number, default: 0 },
        beeWins: { type: Number, default: 0 },
        waspWins: { type: Number, default: 0 },
        neutralWins: { type: Number, default: 0 }
    },
    currency: {
        type: Number,
        default: 0
    },
    customRoles: [{
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        emoji: {
            type: String,
            required: true
        },
        team: {
            type: String,
            enum: ['bee', 'wasp', 'neutral'],
            required: true
        },
        subteam: {
            type: String,
            enum: ['killing', 'evil', 'benign', 'chaos'],
            default: null
        },
        description: {
            type: String,
            required: true
        },
        winCondition: {
            type: String,
            required: true
        },
        abilities: [{
            id: String,
            config: mongoose.Schema.Types.Mixed
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        username: this.username,
        displayName: this.displayName,
        avatar: this.avatar,
        discordId: this.discordId,
        stats: this.stats,
        currency: this.currency,
        customRoles: this.customRoles || []
    };
};

module.exports = mongoose.model('User', userSchema);
