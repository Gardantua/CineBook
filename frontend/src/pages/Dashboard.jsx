import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchActivities = async (pageNum, replace = false) => {
        if (!user) return;

        const isFirstLoad = pageNum === 1;
        if (isFirstLoad) setLoading(true);
        else setLoadingMore(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/feed', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: pageNum }
            });
            const data = response.data;

            if (replace) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }

            // Backend 10 kayıt dönüyor, daha az gelirse son sayfa
            setHasMore(data.length >= 10);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Aktivite akışı yüklenemedi.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setPage(1);
        setHasMore(true);
        fetchActivities(1, true);
    }, [user]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(nextPage, false);
    };

    if (!user) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">CineBook'a Hoş Geldiniz</h2>
                    <p className="text-gray-400 mb-8 max-w-md">Favori film ve kitaplarınızı takip edin, arkadaşlarınızın aktivitelerini görün.</p>
                    <a href="/login" className="px-8 py-3 rounded-full bg-accent text-white font-bold shadow-lg hover:scale-105 transition-transform">
                        Giriş Yap
                    </a>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-white border-b border-white/10 pb-4">Aktivite Akışı</h2>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-400">{error}</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p>Henüz aktivite yok. Kişileri takip edin veya kütüphanenize içerik ekleyin!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {activities.map(activity => (
                            <ActivityCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                )}

                {/* Daha Fazla Yükle */}
                {!loading && activities.length > 0 && (
                    <div className="text-center py-12">
                        {hasMore ? (
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 border border-white/10 disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                                        Yükleniyor...
                                    </span>
                                ) : 'Daha Fazla Yükle'}
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500">Tüm aktiviteler yüklendi.</p>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;
