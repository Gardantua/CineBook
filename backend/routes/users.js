const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Search Users
router.get('/search', async (req, res) => {
    console.log('Search route hit', req.query);
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: q
                }
            },
            select: {
                id: true,
                username: true,
                avatar: true
            },
            take: 5
        });
        console.log('Search results:', users.length);
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile (Public)
router.get('/:id', async (req, res) => {
    console.log('Profile route hit', req.params.id);
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    const currentUserId = parseInt(req.query.currentUserId); // To check follow status

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        lists: true // This counts lists, but we might want item counts
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if following
        let isFollowing = false;
        if (currentUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: userId
                    }
                }
            });
            isFollowing = !!follow;
        }

        // Get item counts manually if needed, or rely on list counts
        // For now, let's just return what we have
        res.json({ ...user, isFollowing });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User's Recent Activities (public)
router.get('/:id/activities', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const limit = parseInt(req.query.limit) || 10;

    try {
        const activities = await prisma.activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                type: true,
                mediaId: true,
                mediaType: true,
                mediaTitle: true,
                mediaPoster: true,
                rating: true,
                comment: true,
                createdAt: true
            }
        });
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Follow User
router.post('/:id/follow', async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const { currentUserId } = req.body;

    if (targetUserId === currentUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    try {
        await prisma.follow.create({
            data: {
                followerId: parseInt(currentUserId),
                followingId: targetUserId
            }
        });
        res.json({ message: 'Followed successfully' });
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint
            return res.status(400).json({ error: 'Already following' });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unfollow User
router.delete('/:id/follow', async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const { currentUserId } = req.body;

    try {
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: parseInt(currentUserId),
                    followingId: targetUserId
                }
            }
        });
        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
