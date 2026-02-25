import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ContentDetail = () => {
    const { type, id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0); // A7: hover fix
    const [userReview, setUserReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // B3: Custom lists state
    const [customLists, setCustomLists] = useState([]);
    const [showCustomMenu, setShowCustomMenu] = useState(false);

    // B2: Edit/delete state
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        fetchContent();
    }, [type, id]);

    // B3: Custom listeleri yükle
    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3000/library/${user.id}`)
                .then(res => setCustomLists(res.data.filter(l => l.type === 'CUSTOM')))
                .catch(() => {});
        }
    }, [user]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:3000/content/${type}/${id}`);
            setContent(response.data);

            if (user && response.data.reviews) {
                const myReview = response.data.reviews.find(r => r.user.id === user.id);
                if (myReview) {
                    setUserRating(myReview.rating || 0);
                    setUserReview(myReview.comment || '');
                }
            }
        } catch (err) {
            console.error("Error fetching content:", err);
            setError("İçerik detayları yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (rating) => {
        if (!user) return alert("Puan vermek için giriş yapın.");
        try {
            await axios.post(`http://localhost:3000/content/${type}/${id}/rate`, {
                userId: user.id,
                rating,
                title: content.title,
                poster: content.poster
            });
            setUserRating(rating);
            fetchContent();
        } catch (err) {
            console.error("Rating error:", err);
            alert("Puan gönderilemedi.");
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Yorum yapmak için giriş yapın.");
        setSubmitting(true);
        try {
            await axios.post(`http://localhost:3000/content/${type}/${id}/review`, {
                userId: user.id,
                comment: userReview,
                title: content.title,
                poster: content.poster
            });
            fetchContent();
        } catch (err) {
            console.error("Review error:", err);
            alert("Yorum gönderilemedi.");
        } finally {
            setSubmitting(false);
        }
    };

    // B2: Yorum düzenle
    const handleEditReview = async (reviewId) => {
        if (!editText.trim()) return;
        try {
            await axios.put(`http://localhost:3000/content/${type}/${id}/review`, {
                userId: user.id,
                comment: editText
            });
            setEditingReviewId(null);
            setEditText('');
            fetchContent();
        } catch (err) {
            console.error("Edit error:", err);
            alert("Yorum düzenlenemedi.");
        }
    };

    // B2: Yorum sil
    const handleDeleteReview = async () => {
        if (!window.confirm("Yorumunuzu silmek istediğinizden emin misiniz?")) return;
        try {
            await axios.delete(`http://localhost:3000/content/${type}/${id}/review`, {
                data: { userId: user.id }
            });
            setUserReview('');
            setUserRating(0);
            fetchContent();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Yorum silinemedi.");
        }
    };

    const addToLibrary = async (listType, listId = null) => {
        if (!user) return alert("Kütüphaneye eklemek için giriş yapın.");
        try {
            const payload = {
                userId: user.id,
                mediaId: content.id,
                mediaType: content.type,
                title: content.title,
                posterPath: content.poster
            };
            if (listId) payload.listId = listId;
            else payload.listType = listType;

            await axios.post('http://localhost:3000/library/add', payload);
            alert(listType ? `"${content.title}" ${listType} listesine eklendi!` : `"${content.title}" özel listeye eklendi!`);
            setShowCustomMenu(false);
        } catch (error) {
            alert(error.response?.data?.error || "Kütüphaneye eklenemedi.");
        }
    };

    if (loading) return <Layout><div className="text-center py-20 text-white">Yükleniyor...</div></Layout>;
    if (error) return <Layout><div className="text-center py-20 text-red-400">{error}</div></Layout>;
    if (!content) return <Layout><div className="text-center py-20 text-white">İçerik bulunamadı.</div></Layout>;

    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative">
                <div className="absolute inset-0 overflow-hidden h-[500px] -z-10">
                    <img src={content.poster} alt="" className="w-full h-full object-cover opacity-20 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>

                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row gap-12">
                        {/* Poster */}
                        <div className="flex-shrink-0 w-64 md:w-80 mx-auto md:mx-0">
                            <div className="rounded-xl overflow-hidden shadow-2xl shadow-accent/20 border border-white/10">
                                <img src={content.poster} alt={content.title} className="w-full h-auto" />
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                {content.type === 'Movie' ? (
                                    <>
                                        <button onClick={() => addToLibrary('Watched')} className="w-full py-3 bg-accent hover:bg-accent-purple text-white rounded-lg font-bold transition-colors shadow-lg">
                                            İzledim
                                        </button>
                                        <button onClick={() => addToLibrary('Watchlist')} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                                            İzlenecekler
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => addToLibrary('Read')} className="w-full py-3 bg-accent hover:bg-accent-purple text-white rounded-lg font-bold transition-colors shadow-lg">
                                            Okudum
                                        </button>
                                        <button onClick={() => addToLibrary('Readlist')} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                                            Okunacaklar
                                        </button>
                                    </>
                                )}

                                {/* B3: Özel Listeye Ekle */}
                                {user && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCustomMenu(!showCustomMenu)}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-colors border border-white/10 text-sm"
                                        >
                                            + Özel Listeye Ekle
                                        </button>
                                        {showCustomMenu && (
                                            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-gray-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                                                {customLists.length === 0 ? (
                                                    <p className="text-gray-500 text-sm p-3 text-center">Özel liste yok</p>
                                                ) : (
                                                    customLists.map(list => (
                                                        <button
                                                            key={list.id}
                                                            onClick={() => addToLibrary(null, list.id.toString())}
                                                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            {list.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-white">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h1>
                            <div className="flex items-center gap-4 text-gray-300 mb-8 text-lg">
                                <span>{content.year}</span>
                                <span>•</span>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{content.type === 'Movie' ? 'Film' : 'Kitap'}</span>
                                {content.avgRating && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center text-yellow-400 gap-1">
                                            ★ <span className="text-white font-bold">{content.avgRating}</span>
                                            <span className="text-gray-500 text-sm">({content.totalRatings} oy)</span>
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="mb-10">
                                <h3 className="text-xl font-bold mb-3 text-accent">Özet</h3>
                                <p className="text-gray-300 leading-relaxed text-lg">{content.description}</p>
                            </div>

                            {/* Rating Section - A7 hover fix */}
                            <div className="bg-white/5 rounded-2xl p-6 mb-10 border border-white/10">
                                <h3 className="text-xl font-bold mb-2">Puanınız</h3>
                                {userRating > 0 && (
                                    <p className="text-gray-400 text-sm mb-3">Mevcut puanınız: <span className="text-yellow-400 font-bold">{userRating}/10</span></p>
                                )}
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className={`text-2xl transition-transform hover:scale-125 ${star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-600'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Yorumlar</h3>

                                {/* Write Review */}
                                <form onSubmit={handleReviewSubmit} className="mb-10 bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <textarea
                                        value={userReview}
                                        onChange={(e) => setUserReview(e.target.value)}
                                        placeholder="Düşüncelerinizi yazın..."
                                        className="w-full bg-black/20 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 ring-accent outline-none min-h-[100px] mb-4"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-6 py-2 bg-accent hover:bg-accent-purple text-white rounded-lg font-bold transition-colors"
                                        >
                                            {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                                        </button>
                                        {/* B2: Kendi yorumu varsa sil butonu */}
                                        {user && content.reviews?.some(r => r.user.id === user.id && r.comment) && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteReview}
                                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg font-bold transition-colors"
                                            >
                                                Yorumu Sil
                                            </button>
                                        )}
                                    </div>
                                </form>

                                {/* Review List */}
                                <div className="space-y-6">
                                    {content.reviews && content.reviews.length > 0 ? (
                                        content.reviews.map((review) => (
                                            <div key={review.id} className="glass-card p-6 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img
                                                        src={review.user.avatar || `https://ui-avatars.com/api/?name=${review.user.username}&background=random`}
                                                        alt={review.user.username}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold">{review.user.username}</h4>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                                                            {review.rating > 0 && (
                                                                <span className="ml-2 text-yellow-400">★ {review.rating}/10</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* B2: Kendi yorumunu düzenle/sil */}
                                                    {user && review.user.id === user.id && review.comment && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingReviewId(review.id);
                                                                setEditText(review.comment);
                                                            }}
                                                            className="text-xs text-gray-500 hover:text-accent transition-colors px-2 py-1 rounded"
                                                        >
                                                            Düzenle
                                                        </button>
                                                    )}
                                                </div>

                                                {/* B2: Edit mode */}
                                                {editingReviewId === review.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            className="w-full bg-black/30 rounded-lg p-3 text-white border border-white/10 focus:border-accent outline-none min-h-[80px]"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditReview(review.id)}
                                                                className="px-4 py-1 bg-accent text-white rounded-lg text-sm font-bold"
                                                            >
                                                                Kaydet
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingReviewId(null)}
                                                                className="px-4 py-1 bg-white/10 text-white rounded-lg text-sm"
                                                            >
                                                                İptal
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    review.comment && (
                                                        <p className="text-gray-300">{review.comment}</p>
                                                    )
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">Henüz yorum yok. İlk yorumu siz yapın!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ContentDetail;
