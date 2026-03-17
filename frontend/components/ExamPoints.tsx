'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExamPointsProps {
    examPoints: any[];
}

const importanceColors: Record<string, { bg: string; color: string }> = {
    high: { bg: '#FFD6D6', color: '#B91C1C' },
    medium: { bg: '#FFF5D6', color: '#8B6914' },
    low: { bg: '#D4F5E9', color: '#1A6B3C' },
};

export default function ExamPoints({ examPoints }: ExamPointsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Sorting: Critical -> High -> Medium
    const importanceWeight = { critical: 3, high: 2, medium: 1, low: 0 };
    const sortedPoints = [...examPoints].sort((a, b) =>
        (importanceWeight[b.importance as keyof typeof importanceWeight] || 0) -
        (importanceWeight[a.importance as keyof typeof importanceWeight] || 0)
    );

    const handleExport = () => {
        window.print();
    };

    if (!sortedPoints.length) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
                <p>No exam points generated yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem',
            }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                    {sortedPoints.length} exam points (Sorted by Importance)
                </span>
                <button
                    onClick={handleExport}
                    className="no-print"
                    style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--text)'
                    }}
                >
                    💾 Export sheet
                </button>
            </div>

            {sortedPoints.map((ep, i) => {
                const imp = importanceColors[ep.importance] || importanceColors.medium;
                return (
                    <motion.div
                        key={ep.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="card"
                        style={{
                            padding: '1.25rem',
                            cursor: 'pointer',
                        }}
                        onClick={() => setExpandedId(expandedId === ep.id ? null : ep.id)}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--muted)',
                                background: 'var(--input-bg)',
                                borderRadius: '6px',
                                padding: '0.2rem 0.45rem',
                                flexShrink: 0,
                                marginTop: '0.1rem',
                            }}>
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="tag-badge">{ep.topic}</span>
                                    {ep.importance && (
                                        <span style={{
                                            background: imp.bg,
                                            color: imp.color,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            padding: '0.15rem 0.45rem',
                                            borderRadius: '5px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}>
                                            {ep.importance}
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    {ep.point}
                                </p>

                                <AnimatePresence>
                                    {expandedId === ep.id && ep.explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}
                                        >
                                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                                                {ep.explanation}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
