import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await axios.post('http://localhost:3000/auth/forgot-password', { email });
            setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
                    <h2 className="text-3xl font-bold text-white mb-6 text-center">Forgot Password</h2>

                    {message && (
                        <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-xl mb-6">
                            {message}
                            <div className="mt-2 text-sm">
                                <Link to="/reset-password" className="underline font-bold">Click here to enter token</Link>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-accent to-accent-purple text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default ForgotPassword;
