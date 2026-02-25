import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
    const { user: currentUser, updateUser } = useAuth();
    const { userId } = useParams(); // Get ID from URL if present

    // Determine if we are viewing our own profile
    const isOwnProfile = !userId || (currentUser && userId === currentUser.id.toString());
    const profileId = isOwnProfile ? (currentUser ? currentUser.id : null) : userId;

    const [profileUser, setProfileUser] = useState(null);
    const [activeTab, setActiveTab] = useState('WATCHED');
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ bio: '', avatar: '' });
    const [isFollowing, setIsFollowing] = useState(false);
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    // B4: Son aktiviteler state
    const [recentActivities, setRecentActivities] = useState([]);

    const DEFAULT_TABS = [
        { id: 'WATCHED', label: 'İzlediklerim' },
        { id: 'WATCHLIST', label: 'İzlenecekler' },
        { id: 'READ', label: 'Okuduklarım' },
        { id: 'READLIST', label: 'Okunacaklar' },
    ];

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!profileId) return;

            try {
                setLoading(true);
                // 1. Fetch User Details & Follow Status
                const userRes = await axios.get(`http://localhost:3000/users/${profileId}`, {
                    params: { currentUserId: currentUser?.id }
                });
                setProfileUser(userRes.data);
                setIsFollowing(userRes.data.isFollowing);

                if (isOwnProfile && currentUser) {
                    setEditForm({ bio: currentUser.bio || '', avatar: currentUser.avatar || '' });
                }

                // 2. Fetch Library
                const libRes = await axios.get(`http://localhost:3000/library/${profileId}`);
                setLists(libRes.data);

                // B4: Son aktiviteleri yükle
                const actRes = await axios.get(`http://localhost:3000/users/${profileId}/activities`, {
                    params: { limit: 5 }
                });
                setRecentActivities(actRes.data);

            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [profileId, currentUser?.id, isOwnProfile]);

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        try {
            const res = await axios.post('http://localhost:3000/library/create', {
                userId: currentUser.id,
                name: newListName
            });
            setLists([...lists, { ...res.data, items: [] }]);
            setNewListName('');
            setIsCreatingList(false);
            setActiveTab(res.data.id.toString()); // Switch to new list
        } catch (error) {
            console.error('Create list error:', error);
            alert('Failed to create list');
        }
    };

    const handleRemove = async (mediaId, e) => {
        e.stopPropagation();
        if (!isOwnProfile) return; // Security check

        // Optimistic UI Update: Remove immediately
        const previousLists = [...lists];
        setLists(prevLists => prevLists.map(list => {
            const isTargetList = (list.type === activeTab) || (list.id.toString() === activeTab);
            if (isTargetList) {
                return {
                    ...list,
                    items: list.items.filter(item => item.mediaId !== mediaId)
                };
            }
            return list;
        }));

        try {
            const payload = {
                userId: currentUser.id,
                mediaId
            };

            // Determine if activeTab is a custom list ID or a default type
            const isCustomList = !isNaN(parseInt(activeTab)) && !DEFAULT_TABS.find(t => t.id === activeTab);

            if (isCustomList) {
                payload.listId = activeTab;
            } else {
                payload.listType = activeTab;
            }

            console.log('Sending remove payload:', payload);

            await axios.delete('http://localhost:3000/library/remove', {
                data: payload
            });

            // Success: No need to do anything, UI is already updated
        } catch (error) {
            console.error('Error removing item:', error);
            // Revert UI on error
            setLists(previousLists);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to remove item';
            alert(`Failed to remove: ${errorMessage}`);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('http://localhost:3000/auth/update', {
                userId: currentUser.id,
                bio: editForm.bio,
                avatar: editForm.avatar
            });
            updateUser(res.data.user);
            setIsEditing(false);
            setProfileUser(prev => ({ ...prev, ...res.data.user }));
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update profile');
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) return alert('Please login to follow');

        try {
            if (isFollowing) {
                await axios.delete(`http://localhost:3000/users/${profileId}/follow`, {
                    data: { currentUserId: currentUser.id }
                });
                setIsFollowing(false);
            } else {
                await axios.post(`http://localhost:3000/users/${profileId}/follow`, {
                    currentUserId: currentUser.id
                });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    const getCurrentItems = () => {
        if (!lists.length) return [];
        // Check if activeTab is a default type (WATCHED, etc.)
        const defaultList = lists.find(l => l.type === activeTab);
        if (defaultList) return defaultList.items;

        // Check if activeTab is a list ID (Custom List)
        const customList = lists.find(l => l.id.toString() === activeTab);
        return customList ? customList.items : [];
    };

    const currentItems = getCurrentItems();

    if (!profileId && !currentUser) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
                    <a href="/login" className="px-6 py-2 rounded-xl bg-accent text-white font-bold hover:scale-105 transition-transform">
                        Sign In
                    </a>
                </div>
            </Layout>
        );
    }

    if (loading || !profileUser) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Profile Header */}
            <div className="glass-panel rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative">
                <img
                    src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.username}&background=random`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-accent shadow-lg shadow-accent/20 object-cover"
                />
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{profileUser.username}</h1>
                    <p className="text-gray-400 mb-4 max-w-2xl">{profileUser.bio || 'No bio yet.'}</p>
                    <div className="flex justify-center md:justify-start gap-6 text-sm">
                        <div className="text-center">
                            <span className="block font-bold text-xl text-white">
                                {lists.filter(l => ['WATCHED', 'WATCHLIST'].includes(l.type))
                                    .reduce((acc, l) => acc + l.items.length, 0)}
                            </span>
                            <span className="text-gray-500">Movies</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-white">
                                {lists.filter(l => ['READ', 'READLIST'].includes(l.type))
                                    .reduce((acc, l) => acc + l.items.length, 0)}
                            </span>
                            <span className="text-gray-500">Books</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-white">{profileUser._count?.followers || 0}</span>
                            <span className="text-gray-500">Takipçi</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-white">{profileUser._count?.following || 0}</span>
                            <span className="text-gray-500">Takip</span>
                        </div>
                    </div>
                </div>

                {isOwnProfile ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <button
                        onClick={handleFollowToggle}
                        className={`px-6 py-2 rounded-lg font-bold transition-colors ${isFollowing
                            ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400'
                            : 'bg-accent hover:bg-accent/80 text-white'
                            }`}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                )}
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-2xl p-8 max-w-md w-full relative">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Avatar URL</label>
                                <input
                                    type="text"
                                    value={editForm.avatar}
                                    onChange={e => setEditForm({ ...editForm, avatar: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent outline-none h-32 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create List Modal */}
            {isCreatingList && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-2xl p-8 max-w-sm w-full relative">
                        <button
                            onClick={() => setIsCreatingList(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">Create New List</h2>
                        <form onSubmit={handleCreateList} className="space-y-4">
                            <input
                                type="text"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent outline-none"
                                placeholder="List Name (e.g., Sci-Fi Favorites)"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                Create
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Library Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 mb-6">
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                    {/* Default Tabs */}
                    {DEFAULT_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {/* Custom Lists */}
                    {lists.filter(l => l.type === 'CUSTOM').map(list => (
                        <button
                            key={list.id}
                            onClick={() => setActiveTab(list.id.toString())}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === list.id.toString()
                                ? 'bg-accent/20 text-accent border border-accent/50'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {list.name}
                        </button>
                    ))}
                </div>

                {isOwnProfile && (
                    <button
                        onClick={() => setIsCreatingList(true)}
                        className="ml-4 px-3 py-2 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        <span>+</span> <span className="hidden md:inline">New List</span>
                    </button>
                )}
            </div>

            {/* Grid */}
            {currentItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/5">
                    <p className="mb-4">This list is empty.</p>
                    {isOwnProfile && (
                        <a href="/discover" className="text-accent hover:underline">Discover content to add</a>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentItems.map(item => (
                        <div key={item.id} className="glass-card rounded-lg overflow-hidden group relative aspect-[2/3]">
                            <Link to={`/content/${(item.mediaType || 'movie').toLowerCase()}/${item.mediaId}`}>
                                <img
                                    src={item.posterPath || 'https://via.placeholder.com/200x300'}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </Link>

                            {isOwnProfile && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                                    <span className="text-white font-bold text-sm mb-2 line-clamp-2">{item.title}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(item.mediaId || item.id, e);
                                        }}
                                        className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white text-xs rounded-full transition-colors pointer-events-auto cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {/* B4: Son Aktiviteler */}
            {recentActivities.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">Son Aktiviteler</h2>
                    <div className="space-y-3">
                        {recentActivities.map(act => (
                            <Link
                                key={act.id}
                                to={`/content/${(act.mediaType || 'movie').toLowerCase()}/${act.mediaId}`}
                                className="flex items-center gap-4 glass-card p-4 rounded-xl hover:bg-white/5 transition-colors group"
                            >
                                <img
                                    src={act.mediaPoster || 'https://via.placeholder.com/60x80'}
                                    alt={act.mediaTitle}
                                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white group-hover:text-accent transition-colors truncate">{act.mediaTitle}</h4>
                                    <p className="text-sm text-gray-400">
                                        {act.rating && act.comment ? 'Oyladı ve yorum yaptı' :
                                            act.rating ? `${act.rating}/10 puan verdi` :
                                                act.comment ? 'Yorum yaptı' :
                                                    'Kütüphaneye ekledi'}
                                    </p>
                                    {act.rating > 0 && (
                                        <span className="text-xs text-yellow-400 font-bold">★ {act.rating}/10</span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-600 flex-shrink-0">
                                    {new Date(act.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Profile;
