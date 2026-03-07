'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); setLoading(false); return; }
        router.push('/dashboard');
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                paddingTop: '80px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                        style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            boxShadow: '0 0 30px rgba(59,130,246,0.4)',
                            fontSize: '1.4rem',
                        }}
                    >
                        A
                    </div>
                    <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.6rem', color: '#F1F5F9', marginBottom: '0.4rem' }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Sign in to continue learning</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Email</label>
                        <input
                            className="aura-input"
                            type="email"
                            placeholder="you@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Password</label>
                        <input
                            className="aura-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', color: '#EF4444', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-glow"
                        disabled={loading}
                        style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                    Don't have an account?{' '}
                    <Link href="/register" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 500 }}>
                        Create one free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
