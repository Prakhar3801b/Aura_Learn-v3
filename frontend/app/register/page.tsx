'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AuraButton } from '@/components/AuraButton';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const redirectTo = `${window.location.origin}/auth/callback`;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: redirectTo,
            },
        });
        if (error) { setError(error.message); setLoading(false); return; }
        setSuccess(true);
        setLoading(false);
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
                {success ? (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📧</div>
                        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#1A1A2E', marginBottom: '0.4rem' }}>
                            Check Your Email
                        </h2>
                        <p style={{ color: '#7C7C8A', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.4rem' }}>
                            We sent a confirmation link to
                        </p>
                        <p style={{ color: '#1A1A2E', fontWeight: 600, fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                            {email}
                        </p>
                        <p style={{ color: '#7C7C8A', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            Click the link in the email to activate your account. Check spam if you don't see it.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto 1rem', border: '1px solid #E8E2DA' }}>
                                <img src="/logo.jpg" alt="Aura Learn" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h1 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A2E', marginBottom: '0.3rem' }}>Create Your Account</h1>
                            <p style={{ color: '#7C7C8A', fontSize: '0.88rem' }}>Start your AI-powered study journey</p>
                        </div>

                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Full Name</label>
                                <input className="aura-input" type="text" placeholder="Your Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Email</label>
                                <input className="aura-input" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Password</label>
                                <input className="aura-input" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                            </div>

                            {error && (
                                <div style={{ background: '#FFD6D6', border: '1px solid #FFBDBD', borderRadius: '8px', padding: '0.65rem', color: '#B91C1C', fontSize: '0.82rem' }}>{error}</div>
                            )}

                            <AuraButton type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.4rem', width: '100%' }}>
                                {loading ? 'Creating account...' : 'Create Account →'}
                            </AuraButton>
                        </form>

                        <p style={{ textAlign: 'center', color: '#7C7C8A', fontSize: '0.82rem', marginTop: '1.5rem' }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: '#1A1A2E', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
