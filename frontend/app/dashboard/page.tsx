'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserMaterials, deleteMaterial, deleteMaterialsBatch } from '@/lib/api';
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
    const [selectMode, setSelectMode] = useState(false); // Used for both Fusion and Deletion
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
        if (!selectMode) return;
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

    const handleDelete = async () => {
        if (!deleteTarget || !user) return;
        setDeleting(true);
        try {
            await deleteMaterial(deleteTarget.id, user.id);
            setMaterials(prev => prev.filter(m => m.id !== deleteTarget.id));
            setDeleteTarget(null);
            setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
        } catch (e) {
            console.error('Delete failed:', e);
        } finally {
            setDeleting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0 || !user) return;
        setDeleting(true);
        try {
            await deleteMaterialsBatch(selectedIds, user.id);
            setMaterials(prev => prev.filter(m => !selectedIds.includes(m.id)));
            setSelectedIds([]);
            setShowBatchDeleteConfirm(false);
            setSelectMode(false);
        } catch (e) {
            console.error('Batch delete failed:', e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>
                                {greeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'} 👋
                            </h1>
                            <p style={{ color: 'var(--muted)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
                                Your AI study dashboard — everything in one place.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <AuraButton
                                variant={selectMode ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setSelectMode(!selectMode);
                                    if (selectMode) setSelectedIds([]);
                                }}
                            >
                                {selectMode ? 'Cancel Selection' : '🎯 Select Multiple'}
                            </AuraButton>
                            
                            {selectMode && selectedIds.length > 0 && (
                                <>
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                        <AuraButton variant="success" size="sm" onClick={handleFusionStart}>
                                            🧬 Fusion ({selectedIds.length})
                                        </AuraButton>
                                    </motion.div>
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                        <AuraButton 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setShowBatchDeleteConfirm(true)}
                                            style={{ color: '#EA4335', borderColor: '#EA4335' }}
                                        >
                                            🗑️ Delete ({selectedIds.length})
                                        </AuraButton>
                                    </motion.div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                {!selectMode && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                        {[
                            { icon: '⬆️', label: 'Upload Material', href: '/upload', bg: 'var(--pastel-sky)' },
                            { icon: '🥽', label: 'AR Labs', href: '/ar-labs', bg: 'var(--pastel-lavender)' },
                            { icon: '⚡', label: 'Study Now', href: materials[0] ? `/study/${materials[0].id}` : '/upload', bg: 'var(--pastel-mint)' },
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
                                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{a.label}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Materials Section */}
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '1rem' }}>
                    {selectMode ? 'Select Materials' : 'Your Study Materials'}
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
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>No materials yet</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Upload your first PDF, image, or video to get started</p>
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
                                    className="material-card-wrapper"
                                >
                                    <Link href={selectMode ? '#' : `/study/${mat.id}`} style={{ textDecoration: 'none' }}>
                                        <div
                                            className={`card material-card ${selectedIds.includes(mat.id) ? 'selected' : ''}`}
                                            style={{
                                                padding: '1.25rem',
                                                cursor: 'pointer',
                                                border: selectedIds.includes(mat.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: selectedIds.includes(mat.id) ? 'var(--pastel-sky)' : 'var(--surface)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem' }}>
                                                <span style={{ fontSize: '1.3rem' }}>{fileTypeIcon[mat.file_type] || '📄'}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</div>
                                                    <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'capitalize', fontFamily: "'JetBrains Mono', monospace" }}>{mat.file_type}</div>
                                                </div>
                                                {selectMode && (
                                                    <div style={{
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        border: '2px solid var(--primary)',
                                                        background: selectedIds.includes(mat.id) ? 'var(--primary)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '10px', color: 'white'
                                                    }}>
                                                        {selectedIds.includes(mat.id) && '✓'}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{
                                                    background: statusBg[mat.status] || 'var(--input-bg)',
                                                    color: statusColor[mat.status] || 'var(--muted)',
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
                                    
                                    {/* Individual Delete Button (only in normal mode) */}
                                    {!selectMode && (
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(mat); }}
                                            className="delete-x-btn"
                                            style={{
                                                position: 'absolute', top: '0.5rem', right: '0.5rem',
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: 'var(--surface)', border: '1px solid var(--border)',
                                                color: 'var(--muted)', fontSize: '0.7rem', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                zIndex: 5
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Single Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => !deleting && setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="card modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                Delete Material?
                            </h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                Are you sure you want to delete &ldquo;{deleteTarget.title}&rdquo;? All associated study data will be lost forever.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <AuraButton variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</AuraButton>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="delete-btn-modal"
                                    style={{ background: '#EA4335', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Batch Delete Confirmation Modal */}
            <AnimatePresence>
                {showBatchDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => !deleting && setShowBatchDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="card modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚨</div>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                Delete {selectedIds.length} Items?
                            </h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                You are about to permanently remove these {selectedIds.length} materials. This action is irreversible.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <AuraButton variant="outline" size="sm" onClick={() => setShowBatchDeleteConfirm(false)}>Cancel</AuraButton>
                                <button
                                    onClick={handleBatchDelete}
                                    disabled={deleting}
                                    className="delete-btn-modal"
                                    style={{ background: '#EA4335', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {deleting ? 'Deleting...' : `Yes, Delete ${selectedIds.length} Items`}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
