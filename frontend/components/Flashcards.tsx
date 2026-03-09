'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuraButton } from './AuraButton';

interface FlashCard {
    id: string;
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
    confidence_score: number;
}

interface FlashcardsProps {
    flashcards: FlashCard[];
    onConfidenceUpdate?: (id: string, score: number) => void;
}

const difficultyColor: Record<string, string> = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
};

export default function Flashcards({ flashcards, onConfidenceUpdate }: FlashcardsProps) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [answered, setAnswered] = useState<Record<number, string>>({});

    if (!flashcards.length) return (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
            <p>Processing flashcards...</p>
        </div>
    );

    const card = flashcards[index];
    const total = flashcards.length;

    const handleAnswer = (correct: boolean) => {
        const score = correct ? Math.min((card.confidence_score || 0.5) + 0.2, 1) : Math.max((card.confidence_score || 0.5) - 0.2, 0);
        setAnswered({ ...answered, [index]: correct ? 'correct' : 'wrong' });
        onConfidenceUpdate?.(card.id, score);
        setTimeout(() => {
            setFlipped(false);
            setIndex((i) => (i + 1) % total);
        }, 400);
    };

    const progress = Math.round((Object.keys(answered).length / total) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            {/* Progress */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Card {index + 1} of {total}</span>
                    <span style={{ color: '#3B82F6', fontSize: '0.78rem', fontWeight: 600 }}>{progress}% done</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(59,130,246,0.15)', borderRadius: '99px' }}>
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Topic & Difficulty */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="tag-badge">{card.topic || 'General'}</span>
                <span style={{ ...{}, color: difficultyColor[card.difficulty] || '#94A3B8', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.7rem', borderRadius: '20px', background: `${difficultyColor[card.difficulty]}15`, border: `1px solid ${difficultyColor[card.difficulty]}30` }}>
                    {card.difficulty}
                </span>
            </div>

            {/* 3D Flip Card */}
            <div
                onClick={() => setFlipped(!flipped)}
                style={{
                    flex: 1,
                    cursor: 'pointer',
                    perspective: '1000px',
                    minHeight: '180px',
                }}
            >
                <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
                >
                    {/* Front */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            background: 'rgba(18,18,26,0.9)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1.5rem',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>QUESTION</div>
                        <p style={{ color: '#F1F5F9', fontSize: '1rem', lineHeight: 1.6 }}>{card.question}</p>
                        <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '1rem' }}>Tap to reveal answer →</div>
                    </div>

                    {/* Back */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1.5rem',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ANSWER</div>
                        <p style={{ color: '#F1F5F9', fontSize: '0.95rem', lineHeight: 1.6 }}>{card.answer}</p>
                    </div>
                </motion.div>
            </div>

            {/* Answer Buttons */}
            <AnimatePresence>
                {flipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: '0.75rem' }}
                    >
                        <AuraButton
                            onClick={() => handleAnswer(false)}
                            variant="danger"
                            className="flex-1"
                        >
                            ✗ Missed
                        </AuraButton>
                        <AuraButton
                            onClick={() => handleAnswer(true)}
                            variant="success"
                            className="flex-1"
                        >
                            ✓ Got it
                        </AuraButton>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <AuraButton size="sm" onClick={() => { setFlipped(false); setIndex((i) => Math.max(i - 1, 0)); }}>← Prev</AuraButton>
                <AuraButton size="sm" onClick={() => { setFlipped(false); setIndex((i) => (i + 1) % total); }}>Next →</AuraButton>
            </div>
        </div>
    );
}
