const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get User Library (All Lists)
router.get('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        // Ensure default lists exist for the user
        const defaultLists = ['Watched', 'Watchlist', 'Read', 'Readlist'];

        for (const type of defaultLists) {
            const exists = await prisma.list.findFirst({
                where: { userId, type: type.toUpperCase() }
            });

            if (!exists) {
                await prisma.list.create({
                    data: {
                        name: type,
                        type: type.toUpperCase(),
                        userId
                    }
                });
            }
        }

        // Fetch all lists with items
        const lists = await prisma.list.findMany({
            where: { userId },
            include: {
                items: {
                    orderBy: { addedAt: 'desc' }
                }
            }
        });

        res.json(lists);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Custom List
router.post('/create', async (req, res) => {
    const { userId, name } = req.body;
    try {
        const newList = await prisma.list.create({
            data: {
                name,
                type: 'CUSTOM',
                userId: parseInt(userId)
            }
        });
        res.json(newList);
    } catch (error) {
        console.error("Create list error:", error);
        res.status(500).json({ error: 'Failed to create list' });
    }
});

// Add Item to List
router.post('/add', async (req, res) => {
    console.log('Received add request:', req.body);
    const { userId, listType, listId, mediaId, mediaType, title, posterPath } = req.body;

    try {
        // Validate required fields
        if (!userId || !mediaId || !mediaType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let targetListId = listId ? parseInt(listId) : null;

        // If no listId, resolve listType to listId
        if (!targetListId && listType) {
            let list = await prisma.list.findFirst({
                where: {
                    userId: parseInt(userId),
                    type: listType.toUpperCase()
                }
            });

            if (!list) {
                // Auto-create default list if missing
                const userExists = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
                if (!userExists) return res.status(404).json({ error: 'User not found' });

                list = await prisma.list.create({
                    data: {
                        name: listType,
                        type: listType.toUpperCase(),
                        userId: parseInt(userId)
                    }
                });
            }
            targetListId = list.id;
        }

        if (!targetListId) {
            return res.status(400).json({ error: 'List ID or valid List Type required' });
        }

        // Verify list exists and belongs to user (or is default)
        const list = await prisma.list.findFirst({
            where: { id: targetListId, userId: parseInt(userId) }
        });

        if (!list) return res.status(404).json({ error: 'List not found' });

        // Check if item already exists
        const existingItem = await prisma.listItem.findFirst({
            where: {
                listId: targetListId,
                mediaId: mediaId.toString()
            }
        });

        if (existingItem) {
            return res.status(400).json({ error: 'Item already in list' });
        }

        // Add item
        const newItem = await prisma.listItem.create({
            data: {
                listId: targetListId,
                mediaId: mediaId.toString(),
                mediaType,
                title,
                posterPath
            }
        });

        // Create Activity
        const activityType = list.type === 'CUSTOM' ? 'ADD_TO_LIST' : `ADD_TO_${list.type}`;

        await prisma.activity.create({
            data: {
                userId: parseInt(userId),
                type: activityType,
                mediaId: mediaId.toString(),
                mediaType,
                mediaTitle: title,
                mediaPoster: posterPath,
                comment: list.type === 'CUSTOM' ? list.name : null
            }
        });

        console.log(`Item added to list ${targetListId}`);
        res.json(newItem);
    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Remove Item from List
router.delete('/remove', async (req, res) => {
    console.log('Remove request body:', req.body);
    const { userId, listType, listId, mediaId } = req.body;

    try {
        if (!userId || !mediaId) {
            console.log('Missing userId or mediaId');
            return res.status(400).json({ error: 'Missing userId or mediaId' });
        }

        let targetListId = null;

        if (listId) {
            targetListId = parseInt(listId);
            if (isNaN(targetListId)) {
                console.log('Invalid listId (NaN):', listId);
                return res.status(400).json({ error: 'Invalid List ID' });
            }
        }

        console.log('Target List ID (initial):', targetListId);

        // If no listId, resolve listType to listId
        if (!targetListId && listType) {
            console.log('Resolving listType:', listType);
            const list = await prisma.list.findFirst({
                where: {
                    userId: parseInt(userId),
                    type: listType.toUpperCase()
                }
            });
            if (list) targetListId = list.id;
        }

        if (!targetListId) {
            console.log('No targetListId found');
            return res.status(400).json({ error: 'List ID or valid List Type required' });
        }

        console.log(`Verifying ownership for list ${targetListId} and user ${userId}`);

        // Verify list ownership
        const list = await prisma.list.findFirst({
            where: {
                id: targetListId,
                userId: parseInt(userId)
            }
        });

        if (!list) {
            console.log('List not found or access denied');
            return res.status(404).json({ error: 'List not found or access denied' });
        }

        console.log(`Removing item ${mediaId} from list ${targetListId}`);
        console.log(`Type of targetListId: ${typeof targetListId}, Type of mediaId: ${typeof mediaId}`);

        try {
            const deleteResult = await prisma.listItem.deleteMany({
                where: {
                    listId: targetListId,
                    mediaId: String(mediaId)
                }
            });

            console.log('Delete result:', deleteResult);
            res.json({ message: 'Item removed', count: deleteResult.count });
        } catch (dbError) {
            console.error('Database error during deleteMany:', dbError);
            throw dbError;
        }

    } catch (error) {
        console.error('Remove error stack:', error.stack);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
