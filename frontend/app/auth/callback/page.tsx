'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Supabase JS client automatically picks up the token from the URL hash
        // when using PKCE flow or magic links. We just need to check the session.
        const handleCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    setErrorMsg(error.message);
                    setStatus('error');
                    return;
                }
                if (data.session) {
                    setStatus('success');
                    setTimeout(() => router.push('/dashboard'), 1500);
                } else {
                    // No session yet — try exchanging the hash params
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (sessionError) {
                            setErrorMsg(sessionError.message);
                            setStatus('error');
                        } else {
                            setStatus('success');
                            setTimeout(() => router.push('/dashboard'), 1500);
                        }
                    } else {
                        setErrorMsg('Invalid or expired confirmation link. Please try registering again.');
                        setStatus('error');
                    }
                }
            } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
                setStatus('error');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div
                style={{
                    background: 'rgba(26,26,39,0.85)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.15)'}`,
                    borderRadius: '16px',
                    padding: '2.5rem',
                    maxWidth: '420px',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                {status === 'verifying' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'glow-pulse 2s ease-in-out infinite' }}>✨</div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', color: '#F1F5F9', marginBottom: '0.5rem' }}>
                            Verifying your email...
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Hang tight, this will only take a moment.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', color: '#10B981', marginBottom: '0.5rem' }}>
                            Email Verified!
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Redirecting you to the dashboard...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', color: '#EF4444', marginBottom: '0.5rem' }}>
                            Verification Failed
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{errorMsg}</p>
                        <a
                            href="/register"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
                                borderRadius: '12px',
                                color: 'white',
                                fontWeight: 600,
                                padding: '0.75rem 1.75rem',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                            }}
                        >
                            Try Again →
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
