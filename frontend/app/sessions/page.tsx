'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text)' }}>Learning Timeline</h2>
                
                {history.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>No sessions yet</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Start studying your materials to see your history here.</p>
                        <Link href="/dashboard"><AuraButton variant="primary">Go to Dashboard</AuraButton></Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {Object.entries(groupedHistory).map(([date, sessions]: [string, any]) => (
                            <div key={date}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>
                                    {date}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {sessions.map((s: any) => (
                                        <div key={s.id} className="session-timeline-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                                                        <span style={{ fontSize: '1.1rem' }}>{s.file_type === 'video' ? '🎬' : '📄'}</span>
                                                        <h4 style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{s.material_title}</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                                                        <span>🕒 {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>📊 Score: {Math.round(s.comprehension_score * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className={`comprehension-badge ${s.comprehension_score > 0.8 ? 'high' : s.comprehension_score > 0.5 ? 'medium' : 'low'}`}>
                                                    {s.comprehension_score > 0.8 ? '✨ Excellent' : s.comprehension_score > 0.5 ? '👍 Good' : '⚠️ Review'}
                                                </div>
                                            </div>

                                            {s.stuck_topics && s.stuck_topics.length > 0 && (
                                                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.6rem', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>Focus Areas:</div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {s.stuck_topics.map((topic: string) => (
                                                            <span key={topic} className="topic-tag">
                                                                {topic}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
