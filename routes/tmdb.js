const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

/**
 * Helper function to shuffle and pick random elements from an array
 */
const getRandomMovies = (movies, count) => {
    return [...movies].sort(() => Math.random() - 0.5).slice(0, count);
};

/**
 * Fetch movie genres and store for mapping
 */
let genreNames = {};
const fetchGenres = async () => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US' }
        });

        if (response.data.genres) {
            genreNames = response.data.genres.reduce((acc, genre) => {
                acc[genre.id] = genre.name;
                return acc;
            }, {});
        }
    } catch (error) {
        console.error('❌ Error fetching genres:', error);
    }
};

// Fetch genres at startup
fetchGenres();

/**
 * 🎬 **Top Picks API (Balanced Mix)**
 */
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
        const topPicks = getRandomMovies([
            ...bollywood.slice(0, 3),
            ...tollywood.slice(0, 3),
            ...hollywood.slice(0, 3),
            ...anime.slice(0, 3)
        ], 10).map(movie => ({
            title: movie.title,
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            genre: movie.genre_ids.map(id => genreNames[id] || "Unknown").join(", "),
            rated: movie.vote_average || "N/A"
        }));

        res.json(topPicks);
    } catch (error) {
        console.error('❌ Error fetching top picks:', error);
        res.status(500).json({ error: 'Failed to fetch top picks' });
    }
});

/**
 * 🎭 **Genre-wise Movie API (Mixed Industries)**
 */
const genreMap = {
    scifi: 878,
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
            .slice(0, 5)
            .map(movie => ({
                title: movie.title,
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                genre: movie.genre_ids.map(id => genreNames[id] || "Unknown").join(", "),
                rated: movie.vote_average || "N/A"
            }));

        res.json(mixedMovies);
    } catch (error) {
        console.error(`❌ Error fetching ${genreName} movies:`, error);
        res.status(500).json({ error: `Failed to fetch ${genreName} movies` });
    }
});

/**
 * 🎟 **GET All Theaters**
 */
router.get("/theaters", (req, res) => {
    res.json(theaters);
});

/**
 * 🎬 **GET Movies Playing in a Specific Theater**
 */
router.get("/theaters/:theaterId/movies", async (req, res) => {
    const { theaterId } = req.params;
    const theater = theaters.find(t => t.id === parseInt(theaterId));

    if (!theater) return res.status(404).json({ error: "Theater not found" });

    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
            params: { api_key: TMDB_API_KEY, language: "en-US", page: 1, region: "IN" }
        });

        if (!response.data.results || response.data.results.length === 0) {
            return res.status(404).json({ error: "No movies currently playing." });
        }

        const filteredMovies = response.data.results.filter(movie =>
            ["hi", "te", "ta", "en", "ja", "ml", "kn", "mr"].includes(movie.original_language)
        );

        const mixedMovies = getRandomMovies(filteredMovies, 6);

        res.json({ theater: theater.name, movies: mixedMovies });
    } catch (error) {
        console.error(`❌ Error fetching movies for theater ${theater.name}:`, error);
        res.status(500).json({ error: "Failed to fetch movies" });
    }
});

module.exports = router;