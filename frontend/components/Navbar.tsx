'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';

const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
    { href: '/ar-labs', label: 'AR Labs' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div
                style={{
                    background: 'rgba(10, 10, 15, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(59,130,246,0.15)',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6, #7C3AED)',
                                borderRadius: '10px',
                                padding: '6px 10px',
                                boxShadow: '0 0 20px rgba(59,130,246,0.4)',
                            }}
                        >
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>A</span>
                        </div>
                        <span
                            style={{
                                fontFamily: 'Outfit',
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                background: 'linear-gradient(135deg, #60A5FA, #7C3AED)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Aura Learn
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: pathname === link.href ? '#60A5FA' : '#94A3B8',
                                    background: pathname === link.href ? 'rgba(59,130,246,0.1)' : 'transparent',
                                    border: pathname === link.href ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    textDecoration: 'none',
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/login"
                            style={{
                                color: '#94A3B8',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                padding: '0.5rem 1rem',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="btn-glow"
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden"
                        style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ borderTop: '1px solid rgba(59,130,246,0.1)', padding: '1rem 1.5rem' }}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 0',
                                    color: pathname === link.href ? '#60A5FA' : '#94A3B8',
                                    textDecoration: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div style={{ paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                            <Link href="/login" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
                            <Link href="/register" className="btn-glow" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Get Started</Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}
