const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const router = express.Router();

// 🎟 **Ticket Booking API (With Authentication)**
router.post('/book', async (req, res) => {
    try {
        const { username, movieId, theaterId, showTime, seats } = req.body;

        // ✅ Basic Validation
        if (!username || !movieId || !theaterId || !showTime || seats === undefined) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        
        // 🔢 Validate Seats
        const numSeats = parseInt(seats, 10);
        if (isNaN(numSeats) || numSeats <= 0) {
            return res.status(400).json({ error: 'Seats must be a positive integer.' });
        }

        // 🔍 **Check if user exists**
        const user = await User.findOne({ username }).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please log in first.' });
        }

        // ✅ Create new ticket
        const newTicket = new Ticket({ username, movieId, theaterId, showTime, seats: numSeats });
        await newTicket.save();

        console.log(`✅ Ticket booked successfully for ${username}`);
        res.status(201).json({ message: '🎟 Ticket booked successfully!', ticket: newTicket });

    } catch (error) {
        console.error('❌ Error booking ticket:', error);
        res.status(500).json({ error: 'An error occurred while booking the ticket. Please try again later.' });
    }
});

// 🎟 **Fetch Booked Tickets for a User**
router.get('/booked/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // 🔍 Validate username
        if (!username) {
            return res.status(400).json({ error: 'Username is required.' });
        }

        // 🔍 Check if user exists
        const user = await User.findOne({ username }).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 📜 Fetch user's tickets
        const tickets = await Ticket.find({ username }).exec();
        if (!tickets.length) {
            return res.status(404).json({ message: 'No tickets found for this user.' });
        }

        res.status(200).json({ tickets });

    } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        res.status(500).json({ error: 'An error occurred while retrieving tickets. Please try again later.' });
    }
});

module.exports = router;