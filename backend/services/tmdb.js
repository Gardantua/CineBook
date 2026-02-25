const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Helper to resolve IP via Google DNS (Bypass local hosts file)
const resolveTmdbIp = async () => {
    try {
        const response = await axios.get('https://dns.google/resolve?name=api.themoviedb.org');
        const answer = response.data.Answer?.find(a => a.type === 1); // Type 1 is A record (IPv4)
        return answer ? answer.data : null;
    } catch (error) {
        console.error("DNS Resolution Error:", error.message);
        return null;
    }
};

const searchMovies = async (query, page = 1, filters = {}) => {
    console.log(`Searching TMDb for: "${query}" (Page ${page}) Filters:`, filters);
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is missing");
        return [];
    }

    try {
        let url = `${BASE_URL}/search/movie`;
        let headers = {};
        const params = {
            api_key: TMDB_API_KEY,
            query,
            page,
            include_adult: false
        };

        // Apply Year Filter
        if (filters.year) {
            params.primary_release_year = filters.year;
        }

        const ip = await resolveTmdbIp();
        if (ip) {
            url = `https://${ip}/3/search/movie`;
            headers['Host'] = 'api.themoviedb.org';
        }

        const response = await axios.get(url, { params, headers });
        let results = response.data.results;

        // Apply Genre Filter (Manual)
        if (filters.genre && GENRES[filters.genre.toLowerCase()]) {
            const genreId = GENRES[filters.genre.toLowerCase()];
            results = results.filter(movie => movie.genre_ids.includes(genreId));
        }

        // Apply Score Filter (Manual)
        if (filters.minRating) {
            results = results.filter(movie => movie.vote_average >= parseFloat(filters.minRating));
        }

        console.log(`Found ${results.length} movies for "${query}"`);
        return {
            results,
            total_pages: response.data.total_pages
        };
    } catch (error) {
        console.error("TMDb Error Details:", error.response ? error.response.data : error.message);
        return { results: [], total_pages: 0 };
    }
};

const getPopularMovies = async (page = 1) => {
    if (!TMDB_API_KEY) return [];
    try {
        let url = `${BASE_URL}/movie/popular`;
        let headers = {};

        const ip = await resolveTmdbIp();
        if (ip) {
            url = `https://${ip}/3/movie/popular`;
            headers['Host'] = 'api.themoviedb.org';
        }

        const response = await axios.get(url, {
            params: { api_key: TMDB_API_KEY, page },
            headers: headers
        });
        return response.data.results;
    } catch (error) {
        console.error("TMDb Popular Error:", error.message);
        return [];
    }
};

const GENRES = {
    'action': 28, 'adventure': 12, 'animation': 16, 'comedy': 35, 'crime': 80,
    'documentary': 99, 'drama': 18, 'family': 10751, 'fantasy': 14, 'history': 36,
    'horror': 27, 'music': 10402, 'mystery': 9648, 'romance': 10749,
    'scifi': 878, 'science fiction': 878, 'thriller': 53, 'war': 10752, 'western': 37
};

const discoverMovies = async ({ genre, year, minRating, page = 1 }) => {
    if (!TMDB_API_KEY) return [];
    try {
        let url = `${BASE_URL}/discover/movie`;
        let headers = {};
        const params = {
            api_key: TMDB_API_KEY,
            sort_by: 'popularity.desc',
            include_adult: false,
            include_video: false,
            page: page
        };

        if (genre && GENRES[genre.toLowerCase()]) {
            params.with_genres = GENRES[genre.toLowerCase()];
        }

        if (year) {
            params.primary_release_year = year;
        }

        if (minRating) {
            params['vote_average.gte'] = minRating;
        }

        const ip = await resolveTmdbIp();
        if (ip) {
            url = `https://${ip}/3/discover/movie`;
            headers['Host'] = 'api.themoviedb.org';
        }

        const response = await axios.get(url, { params, headers });
        return response.data.results;
    } catch (error) {
        console.error("TMDb Discover Error:", error.message);
        return [];
    }
};

module.exports = { searchMovies, getPopularMovies, discoverMovies };
