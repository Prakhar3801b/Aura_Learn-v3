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
                <div className="max-w-full mx-auto px-8 py-4 grid grid-cols-3 items-center">
                    {/* Column 1: Logo (Left) */}
                    <Link href="/" className="flex items-center gap-3 group justify-self-start">
                        {/* Original Logo (Rollback):
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
                        */}
                        <img
                            src="/logo.jpg"
                            alt="Aura Learn Logo"
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                objectFit: 'cover'
                            }}
                        />
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

                    {/* Column 2: Desktop Nav (Center) */}
                    <div className="hidden md:flex items-center gap-1 justify-self-center">
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

                    {/* Column 3: Mobile + Desktop CTAs (Right) */}
                    <div className="flex items-center gap-2 md:gap-3 justify-self-end">
                        <Link
                            href="/login"
                            className="btn-aura-gradient"
                        >
                            <div className="bg-layers">
                                <div className="layer-1"></div>
                                <div className="layer-2"></div>
                                <div className="layer-3"></div>
                                <div className="layer-4"></div>
                                <div className="layer-5"></div>
                                <div className="hover-layer"></div>
                            </div>
                            <span className="label">Sign In</span>
                        </Link>
                        <Link
                            href="/register"
                            className="btn-get-started"
                        >
                            <span className="hidden sm:inline">Get Started</span>
                            <span className="sm:hidden">Start</span>
                            <div className="icon">
                                <svg
                                    height="20"
                                    width="20"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M0 0h24v24H0z" fill="none"></path>
                                    <path
                                        d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            </div>
                        </Link>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden ml-2"
                            style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}
                        >
                            {menuOpen ? '✕' : '☰'}
                        </button>
                    </div>
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
                        <div style={{ paddingTop: '1rem' }}>
                            <Link href="/dashboard" style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>Go to App →</Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}
