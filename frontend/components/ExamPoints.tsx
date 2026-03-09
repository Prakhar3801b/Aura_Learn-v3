'use client';

import { useState } from 'react';
import { AuraButton } from './AuraButton';

interface ExamPoint {
    id: string;
    point: string;
    topic: string;
    importance: string;
}

interface ExamPointsProps {
    examPoints: ExamPoint[];
}

const importanceColor: Record<string, string> = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#3B82F6',
};
const importanceIcon: Record<string, string> = {
    critical: '🔴',
    high: '🟡',
    medium: '🔵',
};

export default function ExamPoints({ examPoints }: ExamPointsProps) {
    const [filter, setFilter] = useState<string>('all');
    const [expanded, setExpanded] = useState<string | null>(null);

    if (!examPoints.length) return (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
            <p>Processing exam points...</p>
        </div>
    );

    const topics = Array.from(new Set(examPoints.map((e) => e.topic))).filter(Boolean);
    const filtered = filter === 'all' ? examPoints : examPoints.filter((e) => e.topic === filter);
    const criticalCount = examPoints.filter((e) => e.importance === 'critical').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflowY: 'auto' }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <div>
                    <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.85rem' }}>{examPoints.length} Key Points Found</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{criticalCount} critical to review</div>
                </div>
            </div>

            {/* Topic Filter */}
            {topics.length > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <AuraButton
                        size="sm"
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </AuraButton>
                    {topics.map((t) => (
                        <AuraButton
                            key={t}
                            size="sm"
                            active={filter === t}
                            onClick={() => setFilter(t)}
                        >
                            {t}
                        </AuraButton>
                    ))}
                </div>
            )}

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.map((ep) => (
                    <div
                        key={ep.id}
                        onClick={() => setExpanded(expanded === ep.id ? null : ep.id)}
                        style={{
                            padding: '0.85rem 1rem',
                            background: 'rgba(18,18,26,0.7)',
                            border: `1px solid ${importanceColor[ep.importance] || '#94A3B8'}25`,
                            borderLeft: `3px solid ${importanceColor[ep.importance] || '#94A3B8'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: '2px' }}>{importanceIcon[ep.importance] || '⚪'}</span>
                            <p style={{ color: '#F1F5F9', fontSize: '0.85rem', lineHeight: 1.5, flex: 1 }}>{ep.point}</p>
                        </div>
                        {ep.topic && (
                            <div style={{ marginTop: '0.4rem', paddingLeft: '1.4rem' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontStyle: 'italic' }}>{ep.topic}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
