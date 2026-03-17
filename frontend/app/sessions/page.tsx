'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserSessionHistory } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { AuraButton } from '@/components/AuraButton';
import Link from 'next/link';

export default function SessionsPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                getUserSessionHistory(data.user.id)
                    .then(res => setHistory(res))
                    .catch(() => { })
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });
    }, []);

    // Group sessions by date for the timeline
    const groupedHistory = history.reduce((acc: any, session: any) => {
        const date = new Date(session.started_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
    }, {});

    // Generate heatmap data (last 364 days to fit exactly 52 weeks)
    const generateHeatmap = () => {
        const days = [];
        const now = new Date();
        for (let i = 363; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = history.filter(s => s.started_at.startsWith(dateStr)).length;
            let level = 0;
            if (count > 0) level = 1;
            if (count > 2) level = 2;
            if (count > 4) level = 3;
            if (count > 6) level = 4;
            days.push({ date: dateStr, level });
        }
        return days;
    };

    const heatmap = generateHeatmap();

    if (loading) return (
        <div style={{ padding: '2.5rem' }}>
            <div className="shimmer" style={{ height: '30px', width: '200px', marginBottom: '1rem' }} />
            <div className="shimmer" style={{ height: '150px', borderRadius: '16px', marginBottom: '2rem' }} />
            <div className="shimmer" style={{ height: '400px', borderRadius: '16px' }} />
        </div>
    );

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1000px', minHeight: '100vh' }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>Session Manager</h1>
                <p style={{ color: 'var(--muted)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Track your learning journey and visualize your progress.</p>
            </motion.div>

            {/* Heatmap Section */}
            <section className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text)' }}>Study Activity</h2>
                <div className="session-heatmap">
                    {heatmap.map((day, i) => (
                        <div 
                            key={i} 
                            className={`heatmap-cell level-${day.level}`} 
                            title={`${day.date}: ${day.level} sessions`}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                    <span>{new Date(new Date().setDate(new Date().getDate() - 363)).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>Less</span>
                        <div className="heatmap-cell" style={{ background: 'var(--border)' }} />
                        <div className="heatmap-cell level-1" />
                        <div className="heatmap-cell level-2" />
                        <div className="heatmap-cell level-3" />
                        <div className="heatmap-cell level-4" />
                        <span>More</span>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>Recent Study Timeline</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Showing last 2 sessions</span>
                </div>
                
                {history.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>No sessions yet</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Start studying your materials to see your history here.</p>
                        <Link href="/dashboard"><AuraButton variant="primary">Go to Dashboard</AuraButton></Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {history.slice(0, 2).map((s: any, idx: number) => (
                            <SessionCard key={s.id} session={s} defaultExpanded={idx === 0} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function SessionCard({ session, defaultExpanded }: { session: any, defaultExpanded: boolean }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const s = session;

    return (
        <div 
            className={`session-timeline-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{s.file_type === 'video' ? '🎬' : '📄'}</span>
                        <h4 style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{s.material_title}</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                        <span>📅 {new Date(s.started_at).toLocaleDateString()}</span>
                        <span>🕒 {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>📊 Score: {Math.round(s.comprehension_score * 100)}%</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`comprehension-badge ${s.comprehension_score > 0.8 ? 'high' : s.comprehension_score > 0.5 ? 'medium' : 'low'}`}>
                        {s.comprehension_score > 0.8 ? '✨ Excellent' : s.comprehension_score > 0.5 ? '👍 Good' : '⚠️ Review'}
                    </div>
                    <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--muted)' }}>▼</span>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {/* Learned & Recap */}
                            <div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>What You Learned</h5>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text)', fontSize: '0.85rem' }}>
                                        {s.insights?.learned?.map((item: string, i: number) => (
                                            <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
                                        )) || <li>Deep dive into key concepts.</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Quick Recap</h5>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                                        "{s.insights?.recap || `A productive session focusing on the core principles of ${s.material_title}.`}"
                                    </p>
                                </div>
                            </div>

                            {/* Doubts & Review */}
                            <div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Doubts / Stuck Topics</h5>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {s.insights?.doubts?.length > 0 || s.stuck_topics?.length > 0 ? (
                                            [...(s.insights?.doubts || []), ...(s.stuck_topics || [])].filter((v, i, a) => a.indexOf(v) === i).map((topic: string) => (
                                                <span key={topic} className="topic-tag" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                                                    {topic}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No doubts detected. Great job!</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--card-gradient)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>AI Session Review</h5>
                                    <p style={{ color: 'var(--text)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                                        {s.insights?.review || "The system is analyzing your engagement. Overall, your comprehension shows steady growth."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
