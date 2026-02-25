const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

// Helper to get movie details from TMDb
const getMovieDetail = async (id) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';

    try {
        const response = await axios.get(`${BASE_URL}/movie/${id}`, {
            params: { api_key: TMDB_API_KEY }
        });

        const m = response.data;
        return {
            id: m.id.toString(),
            title: m.title,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
            description: m.overview,
            type: 'Movie',
            source: 'tmdb',
            genres: m.genres ? m.genres.map(g => g.name) : []
        };
    } catch (error) {
        console.error("TMDb Detail Error:", error.message);
        return null;
    }
};

// Helper to get book details from Google Books
const getBookDetail = async (id) => {
    const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
    const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

    try {
        const response = await axios.get(`${BASE_URL}/${id}`, {
            params: { key: GOOGLE_BOOKS_API_KEY }
        });

        const b = response.data;
        return {
            id: b.id,
            title: b.volumeInfo.title,
            poster: b.volumeInfo.imageLinks?.thumbnail || null,
            year: b.volumeInfo.publishedDate ? b.volumeInfo.publishedDate.split('-')[0] : 'N/A',
            description: b.volumeInfo.description?.replace(/<[^>]*>/g, '') || 'No description available.', // Strip HTML
            type: 'Book',
            source: 'google_books',
            genres: b.volumeInfo.categories || []
        };
    } catch (error) {
        console.error("Google Books Detail Error:", error.message);
        return null;
    }
};

// GET Content Detail
router.get('/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    try {
        let content = null;

        if (type === 'movie') {
            content = await getMovieDetail(id);
        } else if (type === 'book') {
            content = await getBookDetail(id);
        } else {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Fetch local reviews and ratings
        const reviews = await prisma.review.findMany({
            where: {
                mediaId: id.toString(),
                mediaType: type === 'movie' ? 'Movie' : 'Book' // Normalize type
            },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate average rating
        const ratings = reviews.filter(r => r.rating > 0);
        const avgRating = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : null;

        res.json({
            ...content,
            reviews,
            avgRating,
            totalRatings: ratings.length
        });

    } catch (error) {
        console.error("Content Detail Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST Rate Content
router.post('/:type/:id/rate', async (req, res) => {
    const { type, id } = req.params;
    const { userId, rating, title, poster } = req.body; // title/poster for activity

    if (!userId || !rating) return res.status(400).json({ error: 'Missing fields' });

    try {
        const mediaType = type === 'movie' ? 'Movie' : 'Book';

        // Upsert Review (Rating is part of Review model)
        // Check if review exists
        const existingReview = await prisma.review.findFirst({
            where: { userId: parseInt(userId), mediaId: id, mediaType }
        });

        let review;
        if (existingReview) {
            review = await prisma.review.update({
                where: { id: existingReview.id },
                data: { rating: parseInt(rating) }
            });
        } else {
            review = await prisma.review.create({
                data: {
                    userId: parseInt(userId),
                    mediaId: id,
                    mediaType,
                    rating: parseInt(rating)
                }
            });
        }

        // Create Activity
        const normalizedMediaType = type.toLowerCase() === 'movie' ? 'Movie' : 'Book';
        const searchId = String(id).trim();
        const searchUserId = Number(userId);

        // Fetch all activities for this user to filter in memory
        const userActivities = await prisma.activity.findMany({
            where: {
                userId: searchUserId,
                type: { in: ['RATING', 'REVIEW', 'ACTIVITY'] }
            }
        });

        const existingActivity = userActivities.find(a =>
            a.mediaId === searchId &&
            a.mediaType === normalizedMediaType
        );

        if (existingActivity) {
            await prisma.activity.update({
                where: { id: existingActivity.id },
                data: {
                    rating: parseInt(rating),
                    type: 'ACTIVITY', // Unify type
                    createdAt: new Date() // Bump to top of feed
                }
            });
        } else {
            await prisma.activity.create({
                data: {
                    userId: searchUserId,
                    type: 'ACTIVITY',
                    mediaId: searchId,
                    mediaType: normalizedMediaType,
                    mediaTitle: title,
                    mediaPoster: poster,
                    rating: parseInt(rating)
                }
            });
        }

        res.json(review);
    } catch (error) {
        console.error("Rate Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST Review Content
router.post('/:type/:id/review', async (req, res) => {
    const { type, id } = req.params;
    const { userId, comment, title, poster } = req.body;

    if (!userId || !comment) return res.status(400).json({ error: 'Missing fields' });

    try {
        const mediaType = type === 'movie' ? 'Movie' : 'Book';

        // Upsert Review
        const existingReview = await prisma.review.findFirst({
            where: { userId: parseInt(userId), mediaId: id, mediaType }
        });

        let review;
        if (existingReview) {
            review = await prisma.review.update({
                where: { id: existingReview.id },
                data: { comment }
            });
        } else {
            review = await prisma.review.create({
                data: {
                    userId: parseInt(userId),
                    mediaId: id,
                    mediaType,
                    comment
                }
            });
        }

        // Create Activity
        const normalizedMediaType = type.toLowerCase() === 'movie' ? 'Movie' : 'Book';
        const searchId = String(id).trim();
        const searchUserId = Number(userId);

        // Fetch all activities for this user to filter in memory
        const userActivities = await prisma.activity.findMany({
            where: {
                userId: searchUserId,
                type: { in: ['RATING', 'REVIEW', 'ACTIVITY'] }
            }
        });

        const existingActivity = userActivities.find(a =>
            a.mediaId === searchId &&
            a.mediaType === normalizedMediaType
        );

        if (existingActivity) {
            await prisma.activity.update({
                where: { id: existingActivity.id },
                data: {
                    comment: comment,
                    type: 'ACTIVITY', // Unify type
                    createdAt: new Date() // Bump to top of feed
                }
            });
        } else {
            await prisma.activity.create({
                data: {
                    userId: searchUserId,
                    type: 'ACTIVITY',
                    mediaId: searchId,
                    mediaType: normalizedMediaType,
                    mediaTitle: title,
                    mediaPoster: poster,
                    comment: comment
                }
            });
        }

        res.json(review);
    } catch (error) {
        console.error("Review Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT - Kendi yorumunu düzenle
router.put('/:type/:id/review', async (req, res) => {
    const { type, id } = req.params;
    const { userId, comment } = req.body;

    if (!userId || !comment) return res.status(400).json({ error: 'Missing fields' });

    try {
        const mediaType = type === 'movie' ? 'Movie' : 'Book';

        const existingReview = await prisma.review.findFirst({
            where: { userId: parseInt(userId), mediaId: id.toString(), mediaType }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const updated = await prisma.review.update({
            where: { id: existingReview.id },
            data: { comment, updatedAt: new Date() }
        });

        res.json(updated);
    } catch (error) {
        console.error('Edit Review Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE - Kendi yorumunu sil
router.delete('/:type/:id/review', async (req, res) => {
    const { type, id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const mediaType = type === 'movie' ? 'Movie' : 'Book';

        const existingReview = await prisma.review.findFirst({
            where: { userId: parseInt(userId), mediaId: id.toString(), mediaType }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await prisma.review.delete({ where: { id: existingReview.id } });

        // İlgili aktiviteyi de temizle
        await prisma.activity.deleteMany({
            where: {
                userId: parseInt(userId),
                mediaId: id.toString(),
                mediaType
            }
        });

        res.json({ message: 'Review deleted' });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
