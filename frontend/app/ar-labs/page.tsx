'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getARLabs } from '@/lib/api';
import { AuraButton } from '@/components/AuraButton';

const categoryColor: Record<string, string> = {
    physics: '#3B82F6',
    chemistry: '#10B981',
    biology: '#F59E0B',
};
const categoryIcon: Record<string, string> = {
    physics: '⚛️',
    chemistry: '🧪',
    biology: '🧬',
};
const difficultyColor: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
};

export default function ARLabsPage() {
    const [labs, setLabs] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getARLabs().then(setLabs).finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? labs : labs.filter((l) => l.category === filter);
    const categories = Array.from(new Set(labs.map((l) => l.category)));

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', padding: '100px 2rem 4rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '99px', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.9rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                            🥽 WebXR — No App Required
                        </span>
                    </div>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                        AR Science Labs
                    </h1>
                    <p style={{ color: '#94A3B8', maxWidth: '540px', lineHeight: 1.6 }}>
                        Project interactive experiments onto your desk using your mobile browser. Physics, Chemistry, and Biology — no headset, no app download.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <AuraButton
                        size="sm"
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                    >
                        All ({labs.length})
                    </AuraButton>
                    {categories.map((cat) => (
                        <AuraButton
                            key={cat}
                            size="sm"
                            active={filter === cat}
                            onClick={() => setFilter(cat)}
                        >
                            {categoryIcon[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)} ({labs.filter((l) => l.category === cat).length})
                        </AuraButton>
                    ))}
                </div>

                {/* Labs Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card shimmer" style={{ height: '220px' }} />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {filtered.map((lab, i) => (
                            <motion.div key={lab.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                <Link href={`/ar-labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="glass-card" style={{ padding: '1.75rem', height: '100%' }}>
                                        {/* Category & Difficulty */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ color: categoryColor[lab.category], fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {categoryIcon[lab.category]} {lab.category}
                                            </span>
                                            <span style={{ color: difficultyColor[lab.difficulty], fontSize: '0.72rem', fontWeight: 600, background: `${difficultyColor[lab.difficulty]}15`, border: `1px solid ${difficultyColor[lab.difficulty]}30`, borderRadius: '20px', padding: '0.15rem 0.6rem' }}>
                                                {lab.difficulty}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#F1F5F9', marginBottom: '0.6rem' }}>{lab.name}</h3>
                                        <p style={{ color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{lab.description}</p>

                                        {/* Tags */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                                            {lab.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="tag-badge" style={{ fontSize: '0.7rem' }}>{tag}</span>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>⏱ ~{lab.duration_minutes} min</span>
                                            <span style={{ color: '#7C3AED', fontSize: '0.82rem', fontWeight: 600 }}>Launch AR →</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Mobile Note */}
                <motion.div
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    style={{ marginTop: '3rem', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                >
                    <span style={{ fontSize: '1.3rem' }}>📱</span>
                    <div>
                        <div style={{ color: '#A78BFA', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>Best Experience on Mobile</div>
                        <p style={{ color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                            Open this page on Chrome for Android for the full WebXR AR experience. Point your phone at a flat surface to place the lab. iOS has limited WebXR support.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
