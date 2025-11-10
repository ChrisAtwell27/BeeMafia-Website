/**
 * Custom Role Management Routes
 * Handles CRUD operations for user-created custom roles
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { authenticate } = require('../middleware/auth');

// Get all custom roles for the authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ customRoles: user.customRoles || [] });
    } catch (error) {
        console.error('Error fetching custom roles:', error);
        res.status(500).json({ error: 'Error fetching custom roles' });
    }
});

// Create a new custom role
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, emoji, team, subteam, description, winCondition, abilities } = req.body;

        // Validation
        if (!name || !emoji || !team || !description || !winCondition) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (team !== 'bee' && team !== 'wasp' && team !== 'neutral') {
            return res.status(400).json({ error: 'Invalid team' });
        }

        if (!Array.isArray(abilities)) {
            return res.status(400).json({ error: 'Abilities must be an array' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check role limit (max 50 custom roles per user)
        if (user.customRoles && user.customRoles.length >= 50) {
            return res.status(400).json({ error: 'Maximum custom roles limit reached (50)' });
        }

        // Generate unique ID for the role
        const roleId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newRole = {
            id: roleId,
            name: name.trim(),
            emoji: emoji.trim(),
            team,
            subteam: subteam || null,
            description: description.trim(),
            winCondition: winCondition.trim(),
            abilities: abilities,
            createdAt: new Date()
        };

        user.customRoles.push(newRole);
        await user.save();

        res.status(201).json({
            message: 'Custom role created successfully',
            role: newRole
        });

    } catch (error) {
        console.error('Error creating custom role:', error);
        res.status(500).json({ error: 'Error creating custom role' });
    }
});

// Update an existing custom role
router.put('/:roleId', authenticate, async (req, res) => {
    try {
        const { roleId } = req.params;
        const { name, emoji, team, subteam, description, winCondition, abilities } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const roleIndex = user.customRoles.findIndex(r => r.id === roleId);
        if (roleIndex === -1) {
            return res.status(404).json({ error: 'Custom role not found' });
        }

        // Update fields if provided
        if (name) user.customRoles[roleIndex].name = name.trim();
        if (emoji) user.customRoles[roleIndex].emoji = emoji.trim();
        if (team) user.customRoles[roleIndex].team = team;
        if (subteam !== undefined) user.customRoles[roleIndex].subteam = subteam;
        if (description) user.customRoles[roleIndex].description = description.trim();
        if (winCondition) user.customRoles[roleIndex].winCondition = winCondition.trim();
        if (abilities) user.customRoles[roleIndex].abilities = abilities;

        await user.save();

        res.json({
            message: 'Custom role updated successfully',
            role: user.customRoles[roleIndex]
        });

    } catch (error) {
        console.error('Error updating custom role:', error);
        res.status(500).json({ error: 'Error updating custom role' });
    }
});

// Delete a custom role
router.delete('/:roleId', authenticate, async (req, res) => {
    try {
        const { roleId } = req.params;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const roleIndex = user.customRoles.findIndex(r => r.id === roleId);
        if (roleIndex === -1) {
            return res.status(404).json({ error: 'Custom role not found' });
        }

        user.customRoles.splice(roleIndex, 1);
        await user.save();

        res.json({ message: 'Custom role deleted successfully' });

    } catch (error) {
        console.error('Error deleting custom role:', error);
        res.status(500).json({ error: 'Error deleting custom role' });
    }
});

// Get a single custom role by ID
router.get('/:roleId', authenticate, async (req, res) => {
    try {
        const { roleId } = req.params;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const role = user.customRoles.find(r => r.id === roleId);
        if (!role) {
            return res.status(404).json({ error: 'Custom role not found' });
        }

        res.json({ role });

    } catch (error) {
        console.error('Error fetching custom role:', error);
        res.status(500).json({ error: 'Error fetching custom role' });
    }
});

module.exports = router;
