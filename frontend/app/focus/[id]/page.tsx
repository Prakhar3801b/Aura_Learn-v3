'use client';

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFlashcards, getExamPoints } from '@/lib/api';
import Link from 'next/link';

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
            {/* Exit Focus Mode */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: 'fixed', top: '1.5rem', left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}
            >
                <Link href={`/study/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(20px)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
                    ← Exit Focus Mode
                </Link>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(20px)', padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>{cardIndex} / {totalCards}</span>
                    <div style={{ width: '80px', height: '3px', background: 'rgba(59,130,246,0.15)', borderRadius: '99px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #7C3AED)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ color: '#3B82F6', fontSize: '0.78rem', fontWeight: 600 }}>{progress}%</span>
                </div>
            </motion.div>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {(['flashcards', 'exampoints'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setCardIndex(0); setFlipped(false); }}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '10px',
                            background: mode === m ? 'rgba(59,130,246,0.2)' : 'rgba(18,18,26,0.7)',
                            border: `1px solid ${mode === m ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.1)'}`,
                            color: mode === m ? '#60A5FA' : '#94A3B8',
                            fontWeight: mode === m ? 700 : 400,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {m === 'flashcards' ? '⚡ Flashcards' : '🎯 Exam Points'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ color: '#94A3B8' }}>Loading...</div>
            ) : mode === 'flashcards' && flashcards.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={cardIndex}
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -60, scale: 0.95 }}
                        transition={{ duration: 0.35 }}
                        style={{ width: '100%', maxWidth: '640px' }}
                    >
                        {/* Flip Card */}
                        <div onClick={() => setFlipped(!flipped)} style={{ cursor: 'pointer', perspective: '1000px', minHeight: '260px' }}>
                            <motion.div
                                animate={{ rotateY: flipped ? 180 : 0 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                style={{ position: 'relative', width: '100%', minHeight: '260px', transformStyle: 'preserve-3d' }}
                            >
                                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'rgba(18,18,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 0 40px rgba(59,130,246,0.1)' }}>
                                    <div style={{ color: '#3B82F6', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>QUESTION</div>
                                    <p style={{ color: '#F1F5F9', fontSize: '1.15rem', lineHeight: 1.7, fontFamily: 'Outfit', fontWeight: 500 }}>{flashcards[cardIndex]?.question}</p>
                                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '1.5rem' }}>Tap to reveal</div>
                                </div>
                                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(16,185,129,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 0 40px rgba(16,185,129,0.1)' }}>
                                    <div style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>ANSWER</div>
                                    <p style={{ color: '#F1F5F9', fontSize: '1.05rem', lineHeight: 1.7 }}>{flashcards[cardIndex]?.answer}</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => { setFlipped(false); setCardIndex((i) => Math.max(i - 1, 0)); }} style={{ padding: '0.7rem 2rem', borderRadius: '12px', background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(20px)' }}>← Prev</button>
                            <button onClick={() => { setFlipped(false); setCardIndex((i) => Math.min(i + 1, flashcards.length - 1)); }} style={{ padding: '0.7rem 2rem', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}>Next →</button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : mode === 'exampoints' && examPoints.length > 0 ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={cardIndex}
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.96 }}
                        transition={{ duration: 0.35 }}
                        style={{ width: '100%', maxWidth: '640px' }}
                    >
                        <div style={{ background: 'rgba(18,18,26,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', padding: '3rem', textAlign: 'center', boxShadow: '0 0 40px rgba(59,130,246,0.1)' }}>
                            <span className="tag-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>{examPoints[cardIndex]?.topic}</span>
                            <p style={{ color: '#F1F5F9', fontSize: '1.15rem', lineHeight: 1.7, fontFamily: 'Outfit', fontWeight: 500 }}>{examPoints[cardIndex]?.point}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => setCardIndex((i) => Math.max(i - 1, 0))} style={{ padding: '0.7rem 2rem', borderRadius: '12px', background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(20px)' }}>← Prev</button>
                            <button onClick={() => setCardIndex((i) => Math.min(i + 1, examPoints.length - 1))} style={{ padding: '0.7rem 2rem', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60A5FA', cursor: 'pointer', fontWeight: 600 }}>Next →</button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div style={{ color: '#94A3B8', textAlign: 'center' }}>
                    <p>No content available yet. Material may still be processing.</p>
                    <Link href={`/study/${id}`} style={{ color: '#3B82F6', marginTop: '1rem', display: 'inline-block' }}>← Return to study view</Link>
                </div>
            )}
        </motion.div>
    );
}
