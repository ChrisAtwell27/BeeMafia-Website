const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement');

// Get all active announcements (public)
router.get('/', async (req, res) => {
    try {
        const activeAnnouncements = await Announcement.find({ active: true })
            .sort({ priority: -1, createdAt: -1 })
            .limit(5)
            .select('title content author createdAt active priority');

        res.json(activeAnnouncements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// Get all announcements (admin)
router.get('/all', async (req, res) => {
    try {
        // Check if user is admin (simplified for now)
        const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const allAnnouncements = await Announcement.find({})
            .sort({ createdAt: -1 });

        res.json(allAnnouncements);
    } catch (error) {
        console.error('Error fetching all announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// Create new announcement (admin)
router.post('/', async (req, res) => {
    try {
        // Check if user is admin
        const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { title, content, author } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newAnnouncement = new Announcement({
            title,
            content,
            author: author || 'Admin',
            active: true,
            priority: 0
        });

        await newAnnouncement.save();

        // Emit to all connected clients via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('announcement_created', newAnnouncement);
        }

        res.status(201).json(newAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// Update announcement (admin)
router.put('/:id', async (req, res) => {
    try {
        // Check if user is admin
        const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { title, content, active, priority } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (active !== undefined) updateData.active = active;
        if (priority !== undefined) updateData.priority = priority;
        updateData.updatedAt = new Date();

        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAnnouncement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        // Emit update to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('announcement_updated', updatedAnnouncement);
        }

        res.json(updatedAnnouncement);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

// Delete announcement (admin)
router.delete('/:id', async (req, res) => {
    try {
        // Check if user is admin
        const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const deletedAnnouncement = await Announcement.findByIdAndDelete(req.params.id);

        if (!deletedAnnouncement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        // Emit deletion to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('announcement_deleted', { id: req.params.id });
        }

        res.json({ message: 'Announcement deleted', announcement: deletedAnnouncement });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

module.exports = router;