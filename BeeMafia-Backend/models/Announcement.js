const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    content: {
        type: String,
        required: true,
        maxLength: 1000
    },
    author: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0  // Higher numbers = higher priority
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Update the updatedAt timestamp on save
announcementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function(limit = 5) {
    return this.find({ active: true })
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit)
        .select('title content author createdAt');
};

module.exports = mongoose.model('Announcement', announcementSchema);