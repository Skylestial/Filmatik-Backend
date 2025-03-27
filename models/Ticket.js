const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Username instead of userId
  movieId: { type: String, required: true }, // Movie ID from TMDB
  theaterId: { type: String, required: true }, // Theater ID
  seats: { type: Number, required: true, min: 1 }, // Number of seats booked
  showTime: { type: Date, required: true }, // Show timing
  createdAt: { type: Date, default: Date.now } // Timestamp
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
