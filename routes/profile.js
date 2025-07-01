const express = require('express');
const User = require('../models/User'); // User model
const Ticket = require('../models/Ticket'); // Ticket model
const router = express.Router();

// 👤 **Get User Profile**
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // 🔍 Check if the user exists
        const user = await User.findOne({ username }).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 🎟 Fetch user's booked tickets
        const tickets = await Ticket.find({ username });

        res.status(200).json({
            message: 'Profile fetched successfully!',
            user,
            tickets
        });
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

module.exports = router;