import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Vitrin kartı - yatay scroll için
const ShowcaseCard = ({ item, onAdd }) => (
    <div className="flex-shrink-0 w-36 glass-card rounded-xl overflow-hidden group relative hover:shadow-xl hover:shadow-accent/10 transition-all duration-300">
        <div className="relative aspect-[2/3] overflow-hidden">
            <Link to={`/content/${item.mediaType.toLowerCase()}/${item.id}`}>
                <img
                    src={item.poster || "https://via.placeholder.com/200x300?text=No+Image"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            </Link>
            {item.vote_average && (
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-yellow-400 font-bold">
                    ★ {item.vote_average?.toFixed(1)}
                </div>
            )}
        </div>
        <div className="p-2">
            <h4 className="text-white text-xs font-bold truncate">{item.title}</h4>
            <p className="text-gray-500 text-xs">{item.year}</p>
        </div>
    </div>
);

const Discover = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [genre, setGenre] = useState('');
    const [year, setYear] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [addingId, setAddingId] = useState(null);
    const [customLists, setCustomLists] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // C1: Vitrin state'leri
    const [popularContent, setPopularContent] = useState({ movies: [], books: [] });
    const [topRatedContent, setTopRatedContent] = useState({ movies: [], books: [] });
    const [showcaseLoading, setShowcaseLoading] = useState(true);

    // Vitrin verilerini yükle
    useEffect(() => {
        const fetchShowcase = async () => {
            setShowcaseLoading(true);
            try {
                const [popularRes, topRatedRes] = await Promise.all([
                    fetch('http://localhost:3000/search/popular'),
                    fetch('http://localhost:3000/search/top-rated')
                ]);
                if (popularRes.ok) setPopularContent(await popularRes.json());
                if (topRatedRes.ok) setTopRatedContent(await topRatedRes.json());
            } catch (err) {
                console.error('Showcase error:', err);
            } finally {
                setShowcaseLoading(false);
            }
        };
        fetchShowcase();
    }, []);

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3000/library/${user.id}`)
                .then(res => setCustomLists(res.data.filter(l => l.type === 'CUSTOM')))
                .catch(() => {});
        }
    }, [user]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            setResults([]);
            fetchResults(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filter, genre, year, minRating]);

    const fetchResults = async (pageNum) => {
        setLoading(true);
        try {
            let endpoint = 'http://localhost:3000/search/multi';
            if (filter === 'movies') endpoint = 'http://localhost:3000/search/movies';
            if (filter === 'books') endpoint = 'http://localhost:3000/search/books';

            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (genre) params.append('genre', genre);
            if (year) params.append('year', year);
            if (minRating > 0) params.append('minRating', minRating);
            params.append('page', pageNum);

            const response = await fetch(`${endpoint}?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const resultsArray = data.results || [];
                setResults(prev => pageNum === 1 ? resultsArray : [...prev, ...resultsArray]);
                setHasMore(resultsArray.length >= 10);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchResults(nextPage);
    };

    const addToLibrary = async (item, listType, listId = null) => {
        if (!user) {
            alert("Kütüphaneye eklemek için giriş yapın.");
            return;
        }
        setAddingId(item.id);
        try {
            const payload = {
                userId: user.id,
                mediaId: item.id,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.poster
            };
            if (listId) payload.listId = listId;
            else payload.listType = listType;

            await axios.post('http://localhost:3000/library/add', payload);
            alert(`"${item.title}" eklendi!`);
        } catch (error) {
            alert(error.response?.data?.error || "Eklenemedi.");
        } finally {
            setAddingId(null);
        }
    };

    const showSearch = searchTerm || genre || year || minRating > 0;

    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative -mt-8 mb-12 py-20 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-purple/20 to-transparent pointer-events-none" />
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 relative z-10">
                    Yeni Dünyalar Keşfet
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 relative z-10">
                    Milyonlarca film ve kitap arasından ara. Bir sonraki favorini bul.
                </p>

                {/* Search Bar */}
                <div className="relative max-w-3xl mx-auto z-10 mb-8">
                    <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full transform scale-95"></div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Film, kitap, yazar ara..."
                            className="w-full glass-input rounded-full py-5 pl-8 pr-16 text-xl focus:ring-2 ring-accent/50 transition-all shadow-2xl placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="absolute right-3 top-3 bg-accent hover:bg-accent-purple text-white rounded-full p-3 transition-all shadow-lg hover:shadow-accent/50">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto z-10 relative">
                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent outline-none"
                    >
                        <option value="">Tüm Türler</option>
                        <option value="Action">Aksiyon</option>
                        <option value="Adventure">Macera</option>
                        <option value="Comedy">Komedi</option>
                        <option value="Drama">Drama</option>
                        <option value="Fantasy">Fantezi</option>
                        <option value="Horror">Korku</option>
                        <option value="Romance">Romantik</option>
                        <option value="SciFi">Bilim Kurgu</option>
                        <option value="Thriller">Gerilim</option>
                    </select>

                    <input
                        type="number"
                        placeholder="Yıl"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent outline-none w-32"
                        min="1900"
                        max="2025"
                    />

                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                        <span className="text-gray-400 text-sm">Min Puan:</span>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            className="w-24 accent-accent"
                        />
                        <span className="text-white font-bold w-6 text-center">{minRating}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                {/* Type Filters */}
                <div className="flex justify-center gap-4 mb-12">
                    {[
                        { key: 'all', label: 'Tümü' },
                        { key: 'movies', label: 'Filmler' },
                        { key: 'books', label: 'Kitaplar' }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${filter === f.key
                                ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-105'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* C1: Vitrin Modülleri - sadece arama yapılmıyorsa göster */}
                {!showSearch && !loading && (
                    <>
                        {/* En Popülerler */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-accent">🔥</span> En Popülerler
                            </h2>
                            {showcaseLoading ? (
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-36 aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {(filter === 'all' || filter === 'movies') && popularContent.movies.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Filmler</h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                                {popularContent.movies.map(item => (
                                                    <ShowcaseCard key={item.id} item={item} onAdd={addToLibrary} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(filter === 'all' || filter === 'books') && popularContent.books.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Kitaplar</h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                                {popularContent.books.map(item => (
                                                    <ShowcaseCard key={item.id} item={item} onAdd={addToLibrary} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* En Yüksek Puanlılar */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-yellow-400">★</span> En Yüksek Puanlılar
                            </h2>
                            {showcaseLoading ? (
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-36 aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {(filter === 'all' || filter === 'movies') && topRatedContent.movies.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Filmler</h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                                {topRatedContent.movies.map(item => (
                                                    <ShowcaseCard key={item.id} item={item} onAdd={addToLibrary} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(filter === 'all' || filter === 'books') && topRatedContent.books.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Kitaplar</h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                                {topRatedContent.books.map(item => (
                                                    <ShowcaseCard key={item.id} item={item} onAdd={addToLibrary} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="border-t border-white/10 mb-12" />
                    </>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mb-4"></div>
                        <p className="text-gray-400 animate-pulse">Aranıyor...</p>
                    </div>
                )}

                {/* Results Grid */}
                {results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {results.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="glass-card rounded-xl overflow-hidden group relative hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500">
                                <div className="relative aspect-[2/3] overflow-hidden">
                                    <Link to={`/content/${item.mediaType.toLowerCase()}/${item.id}`}>
                                        <img
                                            src={item.poster || "https://via.placeholder.com/300x450?text=No+Image"}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </Link>
                                    {/* Overlay with Actions */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 pointer-events-none">
                                        <h4 className="text-white font-bold text-center mb-2">{item.title}</h4>

                                        <div className="flex flex-col gap-2 w-full pointer-events-auto">
                                            {item.mediaType === 'Movie' ? (
                                                <>
                                                    <button
                                                        onClick={() => addToLibrary(item, 'Watched')}
                                                        disabled={addingId === item.id}
                                                        className="w-full py-2 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg text-sm font-bold transition-colors border border-accent/50"
                                                    >
                                                        İzledim
                                                    </button>
                                                    <button
                                                        onClick={() => addToLibrary(item, 'Watchlist')}
                                                        disabled={addingId === item.id}
                                                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        İzlenecekler
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => addToLibrary(item, 'Read')}
                                                        disabled={addingId === item.id}
                                                        className="w-full py-2 bg-accent-purple/20 hover:bg-accent-purple text-accent-purple hover:text-white rounded-lg text-sm font-bold transition-colors border border-accent-purple/50"
                                                    >
                                                        Okudum
                                                    </button>
                                                    <button
                                                        onClick={() => addToLibrary(item, 'Readlist')}
                                                        disabled={addingId === item.id}
                                                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Okunacaklar
                                                    </button>
                                                </>
                                            )}

                                            {customLists.length > 0 && (
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            addToLibrary(item, null, e.target.value);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    disabled={addingId === item.id}
                                                    className="w-full py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg text-sm font-medium transition-colors border border-white/10 outline-none cursor-pointer text-center appearance-none"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Özel Listeye Ekle...</option>
                                                    {customLists.map(list => (
                                                        <option key={list.id} value={list.id} className="bg-gray-900 text-white">
                                                            {list.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-white font-bold uppercase tracking-wider border border-white/10">
                                        {item.mediaType === 'Movie' ? 'Film' : 'Kitap'}
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5">
                                    <h3 className="font-bold text-white text-lg truncate mb-1 group-hover:text-accent transition-colors">{item.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{item.year}</span>
                                        <span>{item.source === 'tmdb' ? '🎬 TMDb' : '📚 Books'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {!loading && results.length > 0 && hasMore && (
                    <div className="flex justify-center py-12">
                        <button
                            onClick={handleLoadMore}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 border border-white/10"
                        >
                            Daha Fazla Yükle
                        </button>
                    </div>
                )}

                {/* No Results */}
                {!loading && results.length === 0 && showSearch && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">😕</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Sonuç bulunamadı</h3>
                        <p className="text-gray-400">Filtrelerinizi veya arama teriminizi değiştirmeyi deneyin.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Discover;
