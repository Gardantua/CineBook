import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);

        if (q.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/users/search?q=${q}`);
            const data = await res.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        }
    };
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 backdrop-blur-md bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Area */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/20 group-hover:shadow-accent/50 transition-all duration-300">
                                C
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight group-hover:text-white transition-colors">
                                CineBook
                            </span>
                        </Link>
                    </div>

                    {/* Center Navigation - Glow Buttons Style */}
                    <div className="hidden md:flex items-center justify-center flex-1 px-8 gap-4">
                        <NavLink to="/" label="Feed" icon={<svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>} />
                        <NavLink to="/discover" label="Discover" icon={<svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>} />
                        {user && (
                            <NavLink to="/library" label="Library" icon={<svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>} />
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* User Search */}
                        <div className="relative">
                            <div className="flex items-center bg-white/5 rounded-xl border border-white/5 focus-within:border-accent/50 focus-within:bg-white/10 transition-all">
                                <span className="pl-3 text-gray-400">
                                    <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Find users..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                    className="bg-transparent border-none text-white placeholder-gray-500 text-sm focus:ring-0 w-32 focus:w-48 transition-all duration-300 py-2.5 px-3"
                                />
                            </div>

                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                    {searchResults.map(u => (
                                        <Link
                                            key={u.id}
                                            to={`/profile/${u.id}`}
                                            className="px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors"
                                            onClick={() => setShowResults(false)}
                                        >
                                            <img
                                                src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random`}
                                                className="w-8 h-8 rounded-full object-cover"
                                                alt={u.username}
                                            />
                                            <span className="text-white text-sm font-medium">{u.username}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {user ? (
                            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                <div className="hidden lg:block text-right">
                                    <div className="text-sm font-bold text-white">{user.username}</div>
                                    <div className="text-xs text-accent font-medium">Member</div>
                                </div>
                                <div className="relative group">
                                    <button className="flex-shrink-0 focus:outline-none ring-2 ring-transparent group-hover:ring-accent/50 rounded-full transition-all duration-300">
                                        <img
                                            className="h-10 w-10 rounded-full border-2 border-white/10 object-cover"
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                            alt="Profile"
                                        />
                                    </button>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-4 w-56 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl py-2 hidden group-hover:block transform origin-top-right transition-all duration-200 z-50 before:absolute before:-top-4 before:left-0 before:w-full before:h-4 before:bg-transparent">
                                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                                            <p className="text-sm text-white font-medium">Signed in as</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/library" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                            <svg width="16" height="16" className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            Your Profile
                                        </Link>
                                        <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                            <svg width="16" height="16" className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            Settings
                                        </Link>
                                        <div className="border-t border-white/5 my-2"></div>
                                        <button
                                            onClick={logout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                        >
                                            <svg width="16" height="16" className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
                                    Sign In
                                </Link>
                                <Link to="/register" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-purple text-white font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-105 transition-all duration-300">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

// Helper Component for Nav Links - Glow Buttons Style
const NavLink = ({ to, label, icon }) => {
    // Basic implementation of active state check (can be improved with useLocation)
    const isActive = window.location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border ${isActive
                ? 'bg-accent/10 text-accent border-accent/50 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white hover:border-white/10'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
};

export default Navbar;
