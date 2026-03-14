'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getARLabs } from '@/lib/api';
import { AuraButton } from '@/components/AuraButton';

const categoryColor: Record<string, string> = {
    physics: '#3B82F6', chemistry: '#34A853', biology: '#F5A623',
};
const categoryBg: Record<string, string> = {
    physics: '#D5E8F5', chemistry: '#D4F5E9', biology: '#FFF5D6',
};
const categoryIcon: Record<string, string> = {
    physics: '⚛️', chemistry: '🧪', biology: '🧬',
};
const difficultyColor: Record<string, string> = {
    beginner: '#34A853', intermediate: '#F5A623', advanced: '#EA4335',
};
const difficultyBg: Record<string, string> = {
    beginner: '#D4F5E9', intermediate: '#FFF5D6', advanced: '#FFD6D6',
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
        <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
            <div style={{ maxWidth: '1000px' }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                    <span className="tag-badge" style={{ marginBottom: '0.75rem', display: 'inline-block', background: '#E8D5F5', borderColor: '#D4BEE8', color: '#6B21A8' }}>
                        🥽 WebXR — No App Required
                    </span>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1A1A2E', marginBottom: '0.4rem' }}>
                        AR Science Labs
                    </h1>
                    <p style={{ color: '#7C7C8A', maxWidth: '500px', lineHeight: 1.6, fontSize: '0.9rem' }}>
                        Project interactive experiments onto your desk using your mobile browser. Physics, Chemistry, and Biology.
                    </p>
                </motion.div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <AuraButton size="sm" active={filter === 'all'} onClick={() => setFilter('all')}>
                        All ({labs.length})
                    </AuraButton>
                    {categories.map((cat) => (
                        <AuraButton key={cat} size="sm" active={filter === cat} onClick={() => setFilter(cat)}>
                            {categoryIcon[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)} ({labs.filter((l) => l.category === cat).length})
                        </AuraButton>
                    ))}
                </div>

                {/* Labs Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {[1, 2, 3, 4].map((i) => <div key={i} className="card shimmer" style={{ height: '200px', borderRadius: '16px' }} />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                        {filtered.map((lab, i) => (
                            <motion.div key={lab.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                                <Link href={`/ar-labs/${lab.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                            <span style={{
                                                color: categoryColor[lab.category],
                                                background: categoryBg[lab.category],
                                                fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                padding: '0.15rem 0.6rem', borderRadius: '6px',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            }}>
                                                {categoryIcon[lab.category]} {lab.category}
                                            </span>
                                            <span style={{
                                                color: difficultyColor[lab.difficulty],
                                                background: difficultyBg[lab.difficulty],
                                                fontSize: '0.68rem', fontWeight: 600,
                                                padding: '0.15rem 0.5rem', borderRadius: '6px',
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}>
                                                {lab.difficulty}
                                            </span>
                                        </div>
                                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1A1A2E', marginBottom: '0.4rem' }}>{lab.name}</h3>
                                        <p style={{ color: '#7C7C8A', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1rem' }}>{lab.description}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                                            {lab.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="tag-badge" style={{ fontSize: '0.68rem' }}>{tag}</span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#7C7C8A', fontSize: '0.75rem' }}>⏱ ~{lab.duration_minutes} min</span>
                                            <span style={{ color: '#1A1A2E', fontSize: '0.8rem', fontWeight: 600 }}>Launch AR →</span>
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
                    style={{ marginTop: '2.5rem', background: '#E8D5F5', border: '1px solid #D4BEE8', borderRadius: '14px', padding: '1.1rem 1.3rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
                >
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <div>
                        <div style={{ color: '#6B21A8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Best Experience on Mobile</div>
                        <p style={{ color: '#7C7C8A', fontSize: '0.8rem', lineHeight: 1.5 }}>
                            Open this page on Chrome for Android for the full WebXR AR experience. iOS has limited WebXR support.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
