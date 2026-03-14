'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AuraButton } from '@/components/AuraButton';

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="card"
                style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        overflow: 'hidden', margin: '0 auto 1rem',
                        border: '1px solid #E8E2DA',
                    }}>
                        <img src="/logo.jpg" alt="Aura Learn" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A2E', marginBottom: '0.3rem' }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: '#7C7C8A', fontSize: '0.88rem' }}>Sign in to continue learning</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Email</label>
                        <input className="aura-input" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Password</label>
                        <input className="aura-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    {error && (
                        <div style={{ background: '#FFD6D6', border: '1px solid #FFBDBD', borderRadius: '8px', padding: '0.65rem', color: '#B91C1C', fontSize: '0.82rem' }}>
                            {error}
                        </div>
                    )}

                    <AuraButton type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.4rem', width: '100%' }}>
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </AuraButton>
                </form>

                <p style={{ textAlign: 'center', color: '#7C7C8A', fontSize: '0.82rem', marginTop: '1.5rem' }}>
                    Don't have an account?{' '}
                    <Link href="/register" style={{ color: '#1A1A2E', textDecoration: 'none', fontWeight: 600 }}>
                        Create one free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
