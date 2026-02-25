import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// A2: Göreceli zaman fonksiyonu
const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'az önce';
    if (diffMin < 60) return `${diffMin} dakika önce`;
    if (diffHr < 24) return `${diffHr} saat önce`;
    if (diffDay < 7) return `${diffDay} gün önce`;
    return date.toLocaleDateString('tr-TR');
};

const ActivityCard = ({ activity }) => {
    const { user: currentUser } = useAuth();
    const { user, type, rating, comment, createdAt, mediaTitle, mediaPoster, mediaType, mediaId, id } = activity;

    const [isLiked, setIsLiked] = useState(activity.isLiked);
    const [likesCount, setLikesCount] = useState(activity.likesCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentsCount, setCommentsCount] = useState(activity.commentsCount || 0);
    // A5: Local comments state (optimistic update)
    const [localComments, setLocalComments] = useState(activity.comments || []);

    const handleLike = async () => {
        if (!currentUser) return alert('Login to like');

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await axios.post(`http://localhost:3000/social/activity/${id}/like`, { userId: currentUser.id });
            } else {
                await axios.delete(`http://localhost:3000/social/activity/${id}/like`, { data: { userId: currentUser.id } });
            }
        } catch (error) {
            console.error('Like error:', error);
            setIsLiked(!newIsLiked);
            setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !currentUser) return;

        try {
            const res = await axios.post(`http://localhost:3000/social/activity/${id}/comment`, {
                userId: currentUser.id,
                content: commentText
            });
            // A5: Optimistic update - yeni yorumu ekle, paneli açık bırak, alert yok
            const newComment = res.data || {
                id: Date.now(),
                content: commentText,
                user: { id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar }
            };
            setLocalComments(prev => [...prev, newComment]);
            setCommentsCount(prev => prev + 1);
            setCommentText('');
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    // A4: Review excerpt - 150 karakter kırpma
    const getExcerpt = (text) => {
        if (!text) return null;
        if (text.length <= 150) return { text, truncated: false };
        return { text: text.slice(0, 150) + '...', truncated: true };
    };

    const excerpt = getExcerpt(comment);

    return (
        <div className="glass-card rounded-2xl p-6 mb-6 text-white transition-all duration-300 hover:bg-white/5 border border-white/5">
            <div className="flex gap-6">
                {/* Left: User Avatar */}
                <div className="flex-shrink-0">
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={user.username}
                        className="w-14 h-14 rounded-full border-2 border-accent/50 shadow-lg object-cover"
                    />
                </div>

                {/* Right: Content */}
                <div className="flex-1 min-w-0">
                    {/* Header Info */}
                    <div className="flex items-baseline flex-wrap gap-2 mb-3">
                        {/* A3: Username → Link */}
                        <Link
                            to={`/profile/${user.id}`}
                            className="font-bold text-lg text-white hover:text-accent cursor-pointer transition-colors"
                        >
                            {user.username}
                        </Link>
                        <span className="text-gray-400 text-sm">
                            {rating && comment ? 'oyladı ve yorum yaptı' :
                                rating ? 'oyladı' :
                                    comment ? 'yorum yaptı' :
                                        type === 'ADD_TO_WATCHLIST' ? 'izleneceklere ekledi' :
                                            type === 'ADD_TO_WATCHED' ? 'izlendi olarak işaretledi' :
                                                type === 'ADD_TO_READLIST' ? 'okunacaklara ekledi' :
                                                    type === 'ADD_TO_READ' ? 'okundu olarak işaretledi' :
                                                        type === 'ADD_TO_LIST' ? 'kütüphaneye ekledi' :
                                                            'etkileşime girdi'}
                            {' '}
                            {mediaType === 'Movie' ? 'bir filmi' : 'bir kitabı'}
                        </span>
                        {/* A2: Göreceli zaman */}
                        <span className="text-xs text-gray-500 ml-auto">{timeAgo(createdAt)}</span>
                    </div>

                    {/* Media Card */}
                    <div className="flex gap-4 bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-colors cursor-pointer group">
                        <Link to={`/content/${mediaType?.toLowerCase()}/${mediaId}`} className="flex-shrink-0 w-20 h-28 overflow-hidden rounded-lg shadow-md">
                            <img
                                src={mediaPoster}
                                alt={mediaTitle}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        </Link>
                        <div className="flex-1 py-1">
                            <h3 className="font-bold text-lg group-hover:text-accent transition-colors line-clamp-1">{mediaTitle}</h3>
                            <p className="text-sm text-gray-400 mb-2">{mediaType}</p>

                            {rating > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-yellow-400 text-sm">
                                        {'★'.repeat(Math.round(rating / 2))}
                                        <span className="text-gray-600">{'★'.repeat(5 - Math.round(rating / 2))}</span>
                                    </div>
                                    <span className="font-bold text-accent">{rating}/10</span>
                                </div>
                            )}

                            {/* A4: Excerpt + "daha fazlasını oku" linki */}
                            {excerpt && (
                                <p className="text-gray-300 text-sm italic">
                                    "{excerpt.text}"
                                    {excerpt.truncated && (
                                        <Link
                                            to={`/content/${mediaType?.toLowerCase()}/${mediaId}`}
                                            className="ml-1 text-accent hover:underline not-italic font-medium"
                                        >
                                            daha fazlasını oku
                                        </Link>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 text-sm transition-colors group ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-500/20' : 'group-hover:bg-red-500/10'}`}>
                                <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </div>
                            <span>{likesCount} Beğeni</span>
                        </button>
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors group"
                        >
                            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            </div>
                            <span>{commentsCount} Yorum</span>
                        </button>
                    </div>

                    {/* A5: Comment panel - kapanmıyor, alert yok */}
                    {showComments && (
                        <div className="mt-4 space-y-4">
                            {localComments.length > 0 && (
                                <div className="space-y-3 pl-2 border-l-2 border-white/10">
                                    {localComments.map(c => (
                                        <div key={c.id} className="text-sm">
                                            <span className="font-bold text-gray-300 mr-2">{c.user.username}</span>
                                            <span className="text-gray-400">{c.content}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Yorum yaz..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-accent outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    Gönder
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
