const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdb');
const booksService = require('../services/books');

// Multi-search endpoint (Movies + Books)
router.get('/multi', async (req, res) => {
    const { q, page = 1, genre, year, minRating } = req.query;

    try {
        let moviesPromise;

        if (q && q.trim()) {
            // Search Mode
            moviesPromise = tmdbService.searchMovies(q, page, { genre, year, minRating });
        } else {
            // Discover Mode (Filters only)
            moviesPromise = tmdbService.discoverMovies({ genre, year, minRating, page }).then(results => ({
                results,
                total_pages: 10 // Mock total pages for discover as it returns array
            }));
        }

        const [moviesData, booksData] = await Promise.all([
            moviesPromise,
            q ? booksService.searchBooks(q, { page }) : { items: [], totalItems: 0 }
        ]);

        // Combine and format results
        const combinedResults = [
            ...(moviesData.results || []).map(m => ({
                id: m.id,
                title: m.title,
                poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                year: m.release_date ? m.release_date.substring(0, 4) : 'N/A',
                mediaType: 'Movie',
                source: 'tmdb',
                overview: m.overview,
                vote_average: m.vote_average
            })),
            ...(booksData.items || []).map(b => ({
                id: b.id,
                title: b.volumeInfo?.title,
                poster: b.volumeInfo?.imageLinks?.thumbnail,
                year: b.volumeInfo?.publishedDate ? b.volumeInfo.publishedDate.substring(0, 4) : 'N/A',
                mediaType: 'Book',
                source: 'google',
                overview: b.volumeInfo?.description,
                authors: b.volumeInfo?.authors
            }))
        ];

        res.json({
            results: combinedResults,
            page: parseInt(page),
            total_pages: Math.max(moviesData.total_pages || 0, Math.ceil((booksData.totalItems || 0) / 10))
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Movies only endpoint
router.get('/movies', async (req, res) => {
    const { q, page = 1, genre, year, minRating } = req.query;
    try {
        let data;
        if (q && q.trim()) {
            data = await tmdbService.searchMovies(q, page, { genre, year, minRating });
        } else {
            const results = await tmdbService.discoverMovies({ genre, year, minRating, page });
            data = { results, total_pages: 10 };
        }

        res.json({
            results: (data.results || []).map(m => ({
                id: m.id,
                title: m.title,
                poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                year: m.release_date ? m.release_date.substring(0, 4) : 'N/A',
                mediaType: 'Movie',
                source: 'tmdb',
                overview: m.overview,
                vote_average: m.vote_average
            })),
            page: parseInt(page),
            total_pages: data.total_pages || 1
        });
    } catch (error) {
        console.error('Movies search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Books only endpoint
router.get('/books', async (req, res) => {
    const { q, page = 1 } = req.query;
    try {
        const data = await booksService.searchBooks(q, { page });
        res.json({
            results: (data.items || []).map(b => ({
                id: b.id,
                title: b.volumeInfo?.title,
                poster: b.volumeInfo?.imageLinks?.thumbnail,
                year: b.volumeInfo?.publishedDate ? b.volumeInfo.publishedDate.substring(0, 4) : 'N/A',
                mediaType: 'Book',
                source: 'google',
                overview: b.volumeInfo?.description,
                authors: b.volumeInfo?.authors
            })),
            page: parseInt(page),
            total_pages: Math.ceil((data.totalItems || 0) / 10)
        });
    } catch (error) {
        console.error('Books search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// En Popüler filmler + kitaplar
router.get('/popular', async (req, res) => {
    try {
        const [moviesData, booksData] = await Promise.all([
            tmdbService.getPopularMovies(1),
            booksService.searchBooks('bestseller', { page: 1 })
        ]);

        // getPopularMovies returns array directly
        const movies = (Array.isArray(moviesData) ? moviesData : []).slice(0, 10).map(m => ({
            id: m.id,
            title: m.title,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            year: m.release_date ? m.release_date.substring(0, 4) : 'N/A',
            mediaType: 'Movie',
            source: 'tmdb',
            vote_average: m.vote_average
        }));

        const books = (booksData.items || []).slice(0, 10).map(b => ({
            id: b.id,
            title: b.volumeInfo?.title,
            poster: b.volumeInfo?.imageLinks?.thumbnail,
            year: b.volumeInfo?.publishedDate ? b.volumeInfo.publishedDate.substring(0, 4) : 'N/A',
            mediaType: 'Book',
            source: 'google'
        }));

        res.json({ movies, books });
    } catch (error) {
        console.error('Popular error:', error);
        res.status(500).json({ error: 'Failed to fetch popular content' });
    }
});

// En Yüksek Puanlı filmler + kitaplar
router.get('/top-rated', async (req, res) => {
    try {
        const [moviesData, booksData] = await Promise.all([
            tmdbService.discoverMovies({ minRating: 8, page: 1 }),
            booksService.searchBooks('award winning', { page: 1 })
        ]);

        const movies = (Array.isArray(moviesData) ? moviesData : (moviesData.results || []))
            .slice(0, 10)
            .map(m => ({
                id: m.id,
                title: m.title,
                poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                year: m.release_date ? m.release_date.substring(0, 4) : 'N/A',
                mediaType: 'Movie',
                source: 'tmdb',
                vote_average: m.vote_average
            }));

        const books = (booksData.items || []).slice(0, 10).map(b => ({
            id: b.id,
            title: b.volumeInfo?.title,
            poster: b.volumeInfo?.imageLinks?.thumbnail,
            year: b.volumeInfo?.publishedDate ? b.volumeInfo.publishedDate.substring(0, 4) : 'N/A',
            mediaType: 'Book',
            source: 'google'
        }));

        res.json({ movies, books });
    } catch (error) {
        console.error('Top-rated error:', error);
        res.status(500).json({ error: 'Failed to fetch top-rated content' });
    }
});

module.exports = router;
