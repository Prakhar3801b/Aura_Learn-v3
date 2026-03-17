'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardsProps {
    flashcards: any[];
    onConfidenceUpdate?: (flashcardId: string, score: number) => void;
}

export default function Flashcards({ flashcards, onConfidenceUpdate }: FlashcardsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (!flashcards.length) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7C7C8A' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
                <p>No flashcards generated yet.</p>
            </div>
        );
    }

    const card = flashcards[currentIndex];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ color: '#7C7C8A', fontSize: '0.78rem' }}>
                    {currentIndex + 1} / {flashcards.length}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {flashcards.map((_, i) => (
                        <div key={i} style={{
                            width: i === currentIndex ? '16px' : '6px',
                            height: '6px',
                            borderRadius: '99px',
                            background: i === currentIndex ? 'var(--primary)' : 'var(--border)',
                            transition: 'all 0.3s ease',
                        }} />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                >
                    <div onClick={() => setFlipped(!flipped)} style={{ cursor: 'pointer', perspective: '1000px', minHeight: '200px' }}>
                        <motion.div
                            animate={{ rotateY: flipped ? 180 : 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            style={{ position: 'relative', width: '100%', minHeight: '200px', transformStyle: 'preserve-3d' }}
                        >
                            {/* Front */}
                            <div className="card" style={{
                                position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                                padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            }}>
                                <div style={{ color: 'var(--primary)', opacity: 0.7, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>QUESTION</div>
                                <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.7, fontWeight: 500 }}>{card.question}</p>
                                <div style={{ color: '#7C7C8A', fontSize: '0.72rem', marginTop: '1rem' }}>Tap to reveal</div>
                            </div>
                            {/* Back */}
                            <div style={{
                                position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                                background: '#D4F5E9', border: '1px solid #B8E8D4', borderRadius: '16px',
                                padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}>
                                <div style={{ color: '#1A6B3C', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>ANSWER</div>
                                <p style={{ color: '#1A1A2E', fontSize: '0.95rem', lineHeight: 1.7 }}>{card.answer}</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Confidence Rating */}
            {flipped && onConfidenceUpdate && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    {[
                        { label: 'Hard', score: 0.2, bg: '#FFD6D6', color: '#B91C1C' },
                        { label: 'Medium', score: 0.5, bg: '#FFF5D6', color: '#8B6914' },
                        { label: 'Easy', score: 0.8, bg: '#D4F5E9', color: '#1A6B3C' },
                    ].map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => {
                                onConfidenceUpdate(card.id, opt.score);
                                setFlipped(false);
                                setCurrentIndex((i) => Math.min(i + 1, flashcards.length - 1));
                            }}
                            style={{
                                background: opt.bg, color: opt.color, border: 'none', borderRadius: '8px',
                                padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'JetBrains Mono', monospace",
                                transition: 'transform 0.15s ease',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Prev / Next */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                <button onClick={() => { setFlipped(false); setCurrentIndex((i) => Math.max(i - 1, 0)); }}
                    className="btn-outline" style={{ fontSize: '0.82rem' }}>← Prev</button>
                <button onClick={() => { setFlipped(false); setCurrentIndex((i) => Math.min(i + 1, flashcards.length - 1)); }}
                    className="btn-outline" style={{ fontSize: '0.82rem' }}>Next →</button>
            </div>
        </div>
    );
}
