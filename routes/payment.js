const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket'); // Ticket model
const User = require('../models/User'); // User model
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // For generating transaction IDs

// 💳 **Dummy Payment API**
router.post('/pay', async (req, res) => {
    try {
        const { username, ticketId, paymentMethod } = req.body;

        // ✅ Basic Validation
        if (!username || !ticketId || !paymentMethod) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // 🔍 **Check if the user exists**
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please log in first.' });
        }

        // 🎟 **Check if the ticket exists**
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        // 🏷 **Check if the ticket is already paid**
        if (ticket.paymentStatus === 'Paid') {
            return res.status(400).json({ error: 'This ticket is already paid.' });
        }

        // 💳 **Simulate Payment Processing**
        const transactionId = uuidv4(); // Generate a unique transaction ID
        const paymentStatus = 'Paid'; // Dummy status

        // ✅ **Update Ticket with Payment Info**
        ticket.paymentStatus = paymentStatus;
        ticket.transactionId = transactionId;
        ticket.paymentMethod = paymentMethod;
        await ticket.save();

        res.status(200).json({
            message: '✅ Payment successful!',
            transactionId,
            paymentStatus,
            ticket
        });

    } catch (error) {
        console.error('❌ Error processing payment:', error);
        res.status(500).json({ error: 'Payment failed. Please try again.' });
    }
});

module.exports = router;
