const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Get Feed
router.get('/', auth, async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        // Get IDs of users followed by current user
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);

        // Include self in feed? Optional. Let's say yes.
        followingIds.push(userId);

        // Fetch activities
        const activities = await prisma.activity.findMany({
            where: {
                userId: { in: followingIds }
            },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                },
                likes: {
                    where: { userId: userId },
                    select: { userId: true }
                },
                comments: {
                    include: {
                        user: {
                            select: { id: true, username: true, avatar: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Transform data to add isLiked field
        const feed = activities.map(activity => ({
            ...activity,
            isLiked: activity.likes.length > 0,
            likesCount: activity._count.likes,
            commentsCount: activity._count.comments,
            likes: undefined, // Remove raw likes array
            _count: undefined // Remove raw count object
        }));

        res.json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
