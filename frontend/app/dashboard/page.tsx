'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserMaterials } from '@/lib/api';
import { AuraButton } from '@/components/AuraButton';

const fileTypeIcon: Record<string, string> = { pdf: '📄', image: '🖼️', video: '🎬' };
const statusColor: Record<string, string> = {
    pending: '#F5A623', processing: '#3B82F6', completed: '#34A853', failed: '#EA4335',
};
const statusBg: Record<string, string> = {
    pending: '#FFF5D6', processing: '#D5E8F5', completed: '#D4F5E9', failed: '#FFD6D6',
};

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [fusionMode, setFusionMode] = useState(false);

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

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        if (!fusionMode) return;
        e.preventDefault();
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleFusionStart = () => {
        if (selectedIds.length === 0) return;
        const ids = selectedIds.join(',');
        window.location.href = `/study/multi?ids=${ids}`;
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
            <div style={{ maxWidth: '1000px' }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1A1A2E' }}>
                                {greeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'} 👋
                            </h1>
                            <p style={{ color: '#7C7C8A', marginTop: '0.3rem', fontSize: '0.9rem' }}>
                                Your AI study dashboard — everything in one place.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <AuraButton
                                variant={fusionMode ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setFusionMode(!fusionMode);
                                    if (fusionMode) setSelectedIds([]);
                                }}
                            >
                                🧬 {fusionMode ? 'Cancel Fusion' : 'Knowledge Fusion'}
                            </AuraButton>
                            {fusionMode && selectedIds.length > 0 && (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <AuraButton variant="success" size="sm" onClick={handleFusionStart}>
                                        Start Session ({selectedIds.length})
                                    </AuraButton>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { icon: '⬆️', label: 'Upload Material', href: '/upload', bg: '#D5E8F5' },
                        { icon: '🥽', label: 'AR Labs', href: '/ar-labs', bg: '#E8D5F5' },
                        { icon: '⚡', label: 'Study Now', href: materials[0] ? `/study/${materials[0].id}` : '/upload', bg: '#D4F5E9' },
                    ].map((a, i) => (
                        <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Link href={a.href} style={{ textDecoration: 'none' }}>
                                <div
                                    className="card"
                                    style={{
                                        padding: '1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: a.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem',
                                    }}>{a.icon}</div>
                                    <span style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '0.9rem' }}>{a.label}</span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Materials */}
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#1A1A2E', marginBottom: '1rem' }}>
                    {fusionMode ? 'Select Materials for Fusion' : 'Your Study Materials'}
                </h2>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card shimmer" style={{ height: '100px', borderRadius: '16px' }} />
                        ))}
                    </div>
                ) : materials.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#1A1A2E', marginBottom: '0.4rem' }}>No materials yet</h3>
                        <p style={{ color: '#7C7C8A', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Upload your first PDF, image, or video to get started</p>
                        <Link href="/upload" style={{ textDecoration: 'none' }}>
                            <AuraButton variant="primary">Upload Now →</AuraButton>
                        </Link>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {materials.map((mat, i) => (
                            <motion.div key={mat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div
                                    onClick={(e) => toggleSelection(mat.id, e)}
                                    style={{ position: 'relative' }}
                                >
                                    <Link href={fusionMode ? '#' : `/study/${mat.id}`} style={{ textDecoration: 'none' }}>
                                        <div
                                            className="card"
                                            style={{
                                                padding: '1.25rem',
                                                cursor: 'pointer',
                                                border: selectedIds.includes(mat.id) ? '2px solid #7C3AED' : '1px solid #E8E2DA',
                                                background: selectedIds.includes(mat.id) ? '#F8F9FF' : '#FFFFFF'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem' }}>
                                                <span style={{ fontSize: '1.3rem' }}>{fileTypeIcon[mat.file_type] || '📄'}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</div>
                                                    <div style={{ color: '#7C7C8A', fontSize: '0.72rem', textTransform: 'capitalize', fontFamily: "'JetBrains Mono', monospace" }}>{mat.file_type}</div>
                                                </div>
                                                {fusionMode && mat.status === 'completed' && (
                                                    <div style={{
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        border: '2px solid #7C3AED',
                                                        background: selectedIds.includes(mat.id) ? '#7C3AED' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '10px', color: 'white'
                                                    }}>
                                                        {selectedIds.includes(mat.id) && '✓'}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{
                                                    background: statusBg[mat.status] || '#F3F0EB',
                                                    color: statusColor[mat.status] || '#7C7C8A',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    textTransform: 'capitalize',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '6px',
                                                }}>{mat.status}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
