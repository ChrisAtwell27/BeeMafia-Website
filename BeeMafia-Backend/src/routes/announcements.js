const express = require('express');
const router = express.Router();

// For now, we'll use in-memory storage since MongoDB is optional
// When MongoDB is configured, this will use the Announcement model
let announcements = [
    {
        id: 1,
        title: "BeeMafia celebrates five years!",
        content: "Join us in celebrating five amazing years of deception, strategy, and community!",
        author: "Admin",
        createdAt: new Date("2024-02-23"),
        active: true,
        priority: 1
    }
];

let nextId = 2;

// Get all active announcements (public)
router.get('/', (req, res) => {
    const activeAnnouncements = announcements
        .filter(a => a.active)
        .sort((a, b) => b.priority - a.priority || new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Limit to 5 most recent

    res.json(activeAnnouncements);
});

// Get all announcements (admin)
router.get('/all', (req, res) => {
    // Check if user is admin (simplified for now)
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    res.json(announcements);
});

// Create new announcement (admin)
router.post('/', (req, res) => {
    // Check if user is admin
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, author } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const newAnnouncement = {
        id: nextId++,
        title,
        content,
        author: author || 'Admin',
        createdAt: new Date(),
        active: true,
        priority: 0
    };

    announcements.unshift(newAnnouncement);

    // Emit to all connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
        io.emit('announcement_created', newAnnouncement);
    }

    res.status(201).json(newAnnouncement);
});

// Update announcement (admin)
router.put('/:id', (req, res) => {
    // Check if user is admin
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const announcementIndex = announcements.findIndex(a => a.id === id);

    if (announcementIndex === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
    }

    const { title, content, active, priority } = req.body;

    announcements[announcementIndex] = {
        ...announcements[announcementIndex],
        title: title || announcements[announcementIndex].title,
        content: content || announcements[announcementIndex].content,
        active: active !== undefined ? active : announcements[announcementIndex].active,
        priority: priority !== undefined ? priority : announcements[announcementIndex].priority,
        updatedAt: new Date()
    };

    // Emit update to all connected clients
    const io = req.app.get('io');
    if (io) {
        io.emit('announcement_updated', announcements[announcementIndex]);
    }

    res.json(announcements[announcementIndex]);
});

// Delete announcement (admin)
router.delete('/:id', (req, res) => {
    // Check if user is admin
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY || 'admin123';

    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const id = parseInt(req.params.id);
    const announcementIndex = announcements.findIndex(a => a.id === id);

    if (announcementIndex === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
    }

    const deletedAnnouncement = announcements.splice(announcementIndex, 1)[0];

    // Emit deletion to all connected clients
    const io = req.app.get('io');
    if (io) {
        io.emit('announcement_deleted', { id });
    }

    res.json({ message: 'Announcement deleted', announcement: deletedAnnouncement });
});

module.exports = router;