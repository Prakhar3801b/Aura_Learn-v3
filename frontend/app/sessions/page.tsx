'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserSessionHistory, API_BASE } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { AuraButton } from '@/components/AuraButton';
import Link from 'next/link';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function SessionsPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                const userId = data.user.id;
                setUser(data.user);
                
                Promise.all([
                    getUserSessionHistory(userId),
                    fetch(`${API_BASE}/rewards/${userId}`).then(res => res.json())
                ])
                .then(([historyData, rewardsData]) => {
                    setHistory(historyData);
                    setRewards(rewardsData);
                })
                .catch(err => console.error("Data fetch failed:", err))
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

    // Prepare Chart Data (last 7 study sessions)
    const chartData = history.slice(0, 10).reverse().map(s => ({
        date: new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(s.comprehension_score * 100)
    }));

    // Weekly Streak Data (Last 7 days)
    const getWeeklyDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const hasStudied = history.some(s => s.started_at.startsWith(dateStr));
            days.push({ 
                label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                active: hasStudied,
                isToday: i === 0
            });
        }
        return days;
    };

    const weeklyDays = getWeeklyDays();

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Weekly Streak Card */}
                <section className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', margin: 0 }}>Weekly Streak</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Study daily to keep the flame alive!</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔥</span>
                            <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1.1rem' }}>{rewards?.streak_count || 0}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                        {weeklyDays.map((day, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: day.isToday ? 'var(--primary)' : 'var(--muted)' }}>{day.label}</span>
                                <div style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: day.active ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'var(--input-bg)',
                                    border: day.isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    boxShadow: day.active ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {day.active ? (
                                        <span style={{ color: 'white', fontSize: '1rem' }}>🔥</span>
                                    ) : (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Activity Graph Card */}
                <section className="card" style={{ padding: '1.5rem', height: '240px' }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--text)' }}>Comprehension Trend</h2>
                    <div style={{ width: '100%', height: '160px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="var(--primary)" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

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
