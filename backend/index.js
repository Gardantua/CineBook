const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Routes
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');
const searchRoutes = require('./routes/search');
const libraryRoutes = require('./routes/library');
const contentRoutes = require('./routes/content');
const userRoutes = require('./routes/users');
const socialRoutes = require('./routes/social');

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/search', searchRoutes);
app.use('/library', libraryRoutes);
app.use('/content', contentRoutes);
app.use('/users', userRoutes);
app.use('/social', socialRoutes);

app.get('/', (req, res) => {
    res.send('CineBook API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
