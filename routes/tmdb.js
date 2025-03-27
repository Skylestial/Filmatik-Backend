const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Helper function to shuffle and pick random elements from an array
 */
const getRandomMovies = (movies, count) => {
    return movies.sort(() => 0.5 - Math.random()).slice(0, count);
};

// 🎬 **Top Picks API (Balanced Mix)**
router.get('/movies/top-picks', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1, region: 'IN' }
        });

        if (!response.data.results) {
            return res.status(500).json({ error: 'Failed to fetch movies' });
        }

        const movies = response.data.results;
        
        // Categorize by industry
        const bollywood = movies.filter(m => m.original_language === 'hi'); // Hindi
        const tollywood = movies.filter(m => m.original_language === 'te'); // Telugu
        const hollywood = movies.filter(m => m.original_language === 'en'); // English
        const anime = movies.filter(m => m.original_language === 'ja'); // Japanese

        // Ensure balanced mix (at least 2-3 from each, with fallback)
        const topPicks = movies.map(movie => ({
    title: movie.title,
    poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,  // ✅ Fix poster
    genre: movie.genre_ids.join(", "),  // ✅ Fix genre mapping
    rated: movie.vote_average  // ✅ Use rating from TMDB
})).slice(0, 10);

        res.json(topPicks);
    } catch (error) {
        console.error('Error fetching top picks:', error);
        res.status(500).json({ error: 'Failed to fetch top picks' });
    }
});

// 🎭 **Genre-wise Movie API (Mixed Industries)**
const genreMap = {
    sciFi: 878,
    supernatural: 14,
    horror: 27,
    comedy: 35,
    animation: 16
};

router.get('/movies/genre/:genre', async (req, res) => {
    const genreName = req.params.genre;
    const genreId = genreMap[genreName];

    if (!genreId) return res.status(400).json({ error: 'Invalid genre' });

    try {
        const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US', with_genres: genreId, region: 'IN' }
        });

        if (!response.data.results || response.data.results.length === 0) {
            return res.status(404).json({ error: `No movies found for ${genreName} genre.` });
        }

        const mixedMovies = response.data.results
            .filter(movie => ["hi", "te", "ta", "en", "ja", "ml", "kn", "mr"].includes(movie.original_language))
            .slice(0, 5); // Limit to 5 per genre

        res.json(mixedMovies);
    } catch (error) {
        console.error(`Error fetching ${genreName} movies:`, error);
        res.status(500).json({ error: `Failed to fetch ${genreName} movies` });
    }
});

// 🎟 **Hardcoded Theater List**
const theaters = [
    { id: 1, name: "PVR Cinemas" },
    { id: 2, name: "INOX" },
    { id: 3, name: "Carnival Cinemas" },
    { id: 4, name: "Cinepolis" },
    { id: 5, name: "Miraj Cinemas" },
    { id: 6, name: "Movietime Cinemas" },
    { id: 7, name: "Wave Cinemas" },
    { id: 8, name: "Rajhans Cinemas" },
    { id: 9, name: "Mukta A2 Cinemas" },
    { id: 10, name: "Gold Cinema" }
];

router.get('/theaters', (req, res) => {
    res.json(theaters);
});

// 🎬 **Movies for Each Theater (Mixed Industry)**
router.get('/theaters/:theaterId/movies', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1, region: 'IN' }
        });

        if (!response.data.results || response.data.results.length === 0) {
            return res.status(404).json({ error: 'No movies currently playing.' });
        }

        const mixedMovies = getRandomMovies(
            response.data.results.filter(movie => ["hi", "te", "ta", "en", "ja", "ml", "kn", "mr"].includes(movie.original_language)),
            6 // Randomly pick 4-6 movies
        );

        res.json(mixedMovies);
    } catch (error) {
        console.error('Error fetching movies for theater:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

module.exports = router;
