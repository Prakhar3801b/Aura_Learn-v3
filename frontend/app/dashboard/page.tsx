'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserMaterials } from '@/lib/api';
import { AuraButton } from '@/components/AuraButton';

const fileTypeIcon: Record<string, string> = { pdf: '📄', image: '🖼️', video: '🎬' };
const statusColor: Record<string, string> = {
    pending: '#F59E0B', processing: '#3B82F6', completed: '#10B981', failed: '#EF4444',
};

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                getUserMaterials(data.user.id)
                    .then((mats) => setMaterials(mats))
                    .catch(() => { })
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });
    }, []);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', padding: '100px 2rem 4rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: '#F1F5F9' }}>
                        {greeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'} 👋
                    </h1>
                    <p style={{ color: '#94A3B8', marginTop: '0.4rem' }}>Your AI study dashboard — everything in one place.</p>
                </motion.div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { icon: '⬆️', label: 'Upload Material', href: '/upload', color: '#3B82F6' },
                        { icon: '🥽', label: 'AR Labs', href: '/ar-labs', color: '#7C3AED' },
                        { icon: '⚡', label: 'Study Now', href: materials[0] ? `/study/${materials[0].id}` : '/upload', color: '#06B6D4' },
                    ].map((a, i) => (
                        <motion.div key={a.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Link href={a.href} style={{ textDecoration: 'none' }}>
                                <div
                                    className="glass-card"
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${a.color}20`, border: `1px solid ${a.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{a.icon}</div>
                                    <span style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.95rem' }}>{a.label}</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Materials */}
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', color: '#F1F5F9', marginBottom: '1rem' }}>
                    Your Study Materials
                </h2>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-card shimmer" style={{ height: '120px' }} />
                        ))}
                    </div>
                ) : materials.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.5rem' }}>No materials yet</h3>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>Upload your first PDF, image, or video to get started</p>
                        <Link href="/upload" style={{ textDecoration: 'none' }}>
                            <AuraButton size="md">Upload Now →</AuraButton>
                        </Link>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {materials.map((mat, i) => (
                            <motion.div key={mat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                <Link href={`/study/${mat.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{fileTypeIcon[mat.file_type] || '📄'}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</div>
                                                <div style={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'capitalize' }}>{mat.file_type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[mat.status] || '#94A3B8' }} />
                                            <span style={{ color: statusColor[mat.status], fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{mat.status}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
