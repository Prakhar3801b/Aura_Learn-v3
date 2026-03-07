'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Flashcards from '@/components/Flashcards';
import ExamPoints from '@/components/ExamPoints';
import { getFlashcards, getExamPoints, getMindMap, getMaterial, updateFlashcardConfidence, startSession, recordEvent } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const MindMap = dynamic(() => import('@/components/MindMap'), { ssr: false });

type Panel = 'mindmap' | 'flashcards' | 'exampoints';

export default function StudyPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [material, setMaterial] = useState<any>(null);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [examPoints, setExamPoints] = useState<any[]>([]);
    const [mindMap, setMindMap] = useState<any>({ nodes: [], edges: [] });
    const [activePanel, setActivePanel] = useState<Panel>('mindmap');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [mat, fcs, eps, mm] = await Promise.all([
                    getMaterial(id),
                    getFlashcards(id),
                    getExamPoints(id),
                    getMindMap(id),
                ]);
                setMaterial(mat);
                setFlashcards(fcs);
                setExamPoints(eps);
                setMindMap(mm);

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const session = await startSession(user.id, id);
                    setSessionId(session.session_id);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        if (sessionId) {
            recordEvent({ session_id: sessionId, material_id: id, event_type: 'node_click', topic: node.label });
        }
    };

    const handleConfidenceUpdate = async (flashcardId: string, score: number) => {
        await updateFlashcardConfidence(flashcardId, score);
        if (sessionId) {
            recordEvent({ session_id: sessionId, material_id: id, event_type: score > 0.5 ? 'correct_answer' : 'wrong_answer' });
        }
    };

    const panels: { id: Panel; label: string; icon: string }[] = [
        { id: 'mindmap', label: 'Mind Map', icon: '🧠' },
        { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: '⚡' },
        { id: 'exampoints', label: `Exam Points (${examPoints.length})`, icon: '🎯' },
    ];

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid #3B82F6', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: '#94A3B8' }}>Loading study material...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem 0', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: '#F1F5F9' }}>
                            {material?.title || 'Study Session'}
                        </h1>
                        <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                            {flashcards.length} flashcards · {examPoints.length} exam points · {mindMap.nodes.length} mind map nodes
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link
                            href={`/focus/${id}`}
                            style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))',
                                border: '1px solid rgba(124,58,237,0.4)',
                                color: '#A78BFA',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                            }}
                        >
                            ⚡ Focus Mode
                        </Link>
                        <Link href="/dashboard" style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(18,18,26,0.8)', border: '1px solid rgba(59,130,246,0.2)', color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← Back
                        </Link>
                    </div>
                </div>

                {/* Panel Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {panels.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActivePanel(p.id)}
                            style={{
                                padding: '0.55rem 1.1rem',
                                borderRadius: '10px',
                                background: activePanel === p.id ? 'rgba(59,130,246,0.15)' : 'rgba(18,18,26,0.6)',
                                border: `1px solid ${activePanel === p.id ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.1)'}`,
                                color: activePanel === p.id ? '#60A5FA' : '#94A3B8',
                                fontWeight: activePanel === p.id ? 700 : 400,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Panel */}
            <div style={{ flex: 1, padding: '0 2rem 2rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePanel}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            height: activePanel === 'mindmap' ? '65vh' : 'auto',
                            minHeight: '400px',
                            background: 'rgba(18,18,26,0.7)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(59,130,246,0.15)',
                            borderRadius: '16px',
                            padding: activePanel === 'mindmap' ? '0' : '1.5rem',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {activePanel === 'mindmap' && (
                            <div style={{ height: '100%' }}>
                                <MindMap
                                    nodes={mindMap.nodes}
                                    edges={mindMap.edges}
                                    onNodeClick={handleNodeClick}
                                />
                                {/* Node Detail Drawer */}
                                <AnimatePresence>
                                    {selectedNode && (
                                        <motion.div
                                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                            transition={{ type: 'spring', damping: 25 }}
                                            style={{
                                                position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px',
                                                background: 'rgba(18,18,26,0.97)',
                                                backdropFilter: 'blur(20px)',
                                                borderLeft: '1px solid rgba(59,130,246,0.2)',
                                                padding: '1.5rem',
                                                overflowY: 'auto',
                                            }}
                                        >
                                            <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                                            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#F1F5F9', marginBottom: '0.75rem', paddingRight: '1.5rem' }}>{selectedNode.label}</div>
                                            {selectedNode.description && (
                                                <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedNode.description}</p>
                                            )}
                                            {selectedNode.video_timestamp_label && (
                                                <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '0.75rem' }}>
                                                    <div style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>⏱ Video Timestamp</div>
                                                    <div style={{ color: '#F1F5F9', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{selectedNode.video_timestamp_label}</div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {activePanel === 'flashcards' && (
                            <Flashcards flashcards={flashcards} onConfidenceUpdate={handleConfidenceUpdate} />
                        )}
                        {activePanel === 'exampoints' && (
                            <ExamPoints examPoints={examPoints} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
