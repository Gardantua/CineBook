import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto mt-20">
                <div className="glass-card p-8 rounded-2xl">
                    <h2 className="text-3xl font-bold text-center mb-8 text-white">Welcome Back</h2>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg glass-input focus:ring-2 focus:ring-accent transition-all"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg glass-input focus:ring-2 focus:ring-accent transition-all"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="flex justify-end mb-2">
                            <Link to="/forgot-password" className="text-sm text-accent hover:text-white transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 btn-primary rounded-lg text-white font-semibold shadow-lg hover:shadow-accent/20"
                        >
                            Sign In
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-accent hover:text-accent-purple transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Login;
