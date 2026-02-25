const axios = require('axios');

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

const searchBooks = async (query, { genre, page = 1 } = {}) => {
    try {
        let q = query || '';
        if (genre) {
            q += `+subject:${genre}`;
        }
        // If no query but genre exists, we need a base query for Google Books
        if (!query && genre) {
            q = `subject:${genre}`;
        }

        if (!q) return [];

        const startIndex = (page - 1) * 10; // Google Books uses 0-based index, default 10 per page
        const params = { q, startIndex, maxResults: 10 };
        if (GOOGLE_BOOKS_API_KEY) params.key = GOOGLE_BOOKS_API_KEY;

        const response = await axios.get(BASE_URL, { params });
        return {
            items: response.data.items || [],
            totalItems: response.data.totalItems || 0
        };
    } catch (error) {
        console.error("Google Books Error:", error.message);
        return [];
    }
};

module.exports = { searchBooks };
