const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Like Activity
router.post('/activity/:id/like', async (req, res) => {
    const { userId } = req.body;
    const activityId = parseInt(req.params.id);

    try {
        await prisma.activityLike.create({
            data: {
                userId: parseInt(userId),
                activityId
            }
        });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation (already liked)
            return res.json({ success: true });
        }
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to like activity' });
    }
});

// Unlike Activity
router.delete('/activity/:id/like', async (req, res) => {
    const { userId } = req.body;
    const activityId = parseInt(req.params.id);

    try {
        await prisma.activityLike.deleteMany({
            where: {
                userId: parseInt(userId),
                activityId
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Unlike error:', error);
        res.status(500).json({ error: 'Failed to unlike activity' });
    }
});

// Comment on Activity
router.post('/activity/:id/comment', async (req, res) => {
    const { userId, content } = req.body;
    const activityId = parseInt(req.params.id);

    try {
        const comment = await prisma.activityComment.create({
            data: {
                userId: parseInt(userId),
                activityId,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        res.json(comment);
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ error: 'Failed to comment' });
    }
});

module.exports = router;
