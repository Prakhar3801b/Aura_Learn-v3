'use client';

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFlashcards, getExamPoints } from '@/lib/api';
import Link from 'next/link';
import { AuraButton } from '@/components/AuraButton';

export default function FocusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [examPoints, setExamPoints] = useState<any[]>([]);
    const [mode, setMode] = useState<'flashcards' | 'exampoints'>('flashcards');
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getFlashcards(id), getExamPoints(id)])
            .then(([fcs, eps]) => { setFlashcards(fcs); setExamPoints(eps); })
            .finally(() => setLoading(false));
    }, [id]);

    const totalCards = mode === 'flashcards' ? flashcards.length : examPoints.length;
    const progress = totalCards > 0 ? Math.round((cardIndex / totalCards) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                position: 'relative',
            }}
        >
            {/* Top bar */}
            <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: 'fixed', top: '1.5rem', left: 'calc(var(--sidebar-width) + 1rem)', right: 'calc(var(--chat-width) + 1rem)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Link href={`/study/${id}`} style={{ textDecoration: 'none' }}>
                    <AuraButton size="sm">← Exit Focus Mode</AuraButton>
                </Link>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.4rem 1rem', borderRadius: '10px' }}>
                    <span style={{ color: '#7C7C8A', fontSize: '0.75rem' }}>{cardIndex} / {totalCards}</span>
                    <div style={{ width: '80px', height: '3px', background: '#E8E2DA', borderRadius: '99px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#1A1A2E', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ color: '#1A1A2E', fontSize: '0.75rem', fontWeight: 600 }}>{progress}%</span>
                </div>
            </motion.div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem' }}>
                {(['flashcards', 'exampoints'] as const).map((m) => (
                    <AuraButton
                        key={m}
                        size="md"
                        active={mode === m}
                        onClick={() => { setMode(m); setCardIndex(0); setFlipped(false); }}
                    >
                        {m === 'flashcards' ? '⚡ Flashcards' : '🎯 Exam Points'}
                    </AuraButton>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ color: '#7C7C8A' }}>Loading...</div>
            ) : mode === 'flashcards' && flashcards.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={cardIndex}
                        initial={{ opacity: 0, x: 50, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', maxWidth: '580px' }}
                    >
                        <div onClick={() => setFlipped(!flipped)} style={{ cursor: 'pointer', perspective: '1000px', minHeight: '240px' }}>
                            <motion.div
                                animate={{ rotateY: flipped ? 180 : 0 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                style={{ position: 'relative', width: '100%', minHeight: '240px', transformStyle: 'preserve-3d' }}
                            >
                                {/* Front */}
                                <div className="card" style={{
                                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                                    padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                }}>
                                    <div style={{ color: '#1A1A2E', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>QUESTION</div>
                                    <p style={{ color: '#1A1A2E', fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 500 }}>{flashcards[cardIndex]?.question}</p>
                                    <div style={{ color: '#7C7C8A', fontSize: '0.75rem', marginTop: '1.25rem' }}>Tap to reveal</div>
                                </div>
                                {/* Back */}
                                <div style={{
                                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                                    background: '#D4F5E9', border: '1px solid #B8E8D4', borderRadius: '16px',
                                    padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                }}>
                                    <div style={{ color: '#1A6B3C', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ANSWER</div>
                                    <p style={{ color: '#1A1A2E', fontSize: '1rem', lineHeight: 1.7 }}>{flashcards[cardIndex]?.answer}</p>
                                </div>
                            </motion.div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <AuraButton size="md" onClick={() => { setFlipped(false); setCardIndex((i) => Math.max(i - 1, 0)); }}>← Prev</AuraButton>
                            <AuraButton size="md" onClick={() => { setFlipped(false); setCardIndex((i) => Math.min(i + 1, flashcards.length - 1)); }}>Next →</AuraButton>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : mode === 'exampoints' && examPoints.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={cardIndex}
                        initial={{ opacity: 0, y: 25, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -25, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', maxWidth: '580px' }}
                    >
                        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                            <span className="tag-badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{examPoints[cardIndex]?.topic}</span>
                            <p style={{ color: '#1A1A2E', fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 500 }}>{examPoints[cardIndex]?.point}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <AuraButton size="md" onClick={() => setCardIndex((i) => Math.max(i - 1, 0))}>← Prev</AuraButton>
                            <AuraButton size="md" onClick={() => setCardIndex((i) => Math.min(i + 1, examPoints.length - 1))}>Next →</AuraButton>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div style={{ color: '#7C7C8A', textAlign: 'center' }}>
                    <p>No content available yet. Material may still be processing.</p>
                    <Link href={`/study/${id}`} style={{ color: '#1A1A2E', marginTop: '0.75rem', display: 'inline-block' }}>← Return to study view</Link>
                </div>
            )}
        </motion.div>
    );
}
