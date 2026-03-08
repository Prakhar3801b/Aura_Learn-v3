'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            const isEnvError = this.state.error?.message?.includes('environment variables');

            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(26,26,39,0.85)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '16px',
                            padding: '2.5rem',
                            maxWidth: '480px',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2
                            style={{
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 700,
                                fontSize: '1.4rem',
                                color: '#F1F5F9',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {isEnvError ? 'Configuration Required' : 'Something went wrong'}
                        </h2>
                        <p
                            style={{
                                color: '#94A3B8',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                marginBottom: '1.5rem',
                            }}
                        >
                            {isEnvError
                                ? 'The application is missing required environment variables. Please contact the administrator.'
                                : 'An unexpected error occurred. Please try again later.'}
                        </p>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 600,
                                padding: '0.75rem 1.75rem',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                            }}
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
