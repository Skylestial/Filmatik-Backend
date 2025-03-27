const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket'); // Ticket model
const User = require('../models/User'); // User model
const router = express.Router();

// 🎟 **Ticket Booking API (With Authentication)**
router.post('/book', async (req, res) => {
    try {
        const { username, movieId, theaterId, showTime, seats } = req.body; // ✅ Fixed field names

        // ✅ Basic Validation
        if (!username || !movieId || !theaterId || !showTime) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (!Number.isInteger(seats) || seats <= 0) {
            return res.status(400).json({ error: 'Seats must be a positive integer.' });
        }

        // 🔍 **Check if the username exists in the database**
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please log in first.' });
        }

        // ✅ Create new ticket
        const newTicket = new Ticket({ username, movieId, theaterId, showTime, seats });
        await newTicket.save();

        res.status(201).json({ message: '🎟 Ticket booked successfully!', ticket: newTicket });
    } catch (error) {
        console.error('❌ Error booking ticket:', error);
        res.status(500).json({ error: 'Failed to book ticket' });
    }
});

// 🎟 **Fetch Booked Tickets for a User**
router.get('/booked/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // 🔍 Check if the user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 🎟 Fetch all booked tickets for the user
        const tickets = await Ticket.find({ username });

        res.status(200).json({ tickets });
    } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

module.exports = router;
