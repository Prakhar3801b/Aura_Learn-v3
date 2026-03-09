'use client';

import { useEffect, useState, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Flashcards from '@/components/Flashcards';
import ExamPoints from '@/components/ExamPoints';
import { getFlashcards, getExamPoints, getMindMap, getMaterial, updateFlashcardConfidence, startSession, recordEvent, Material, API_BASE } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import Chatbox from '@/components/Chatbox';
import { AuraButton } from '@/components/AuraButton';

const MindMap = dynamic(() => import('@/components/MindMap'), { ssr: false });

type Panel = 'mindmap' | 'flashcards' | 'exampoints';

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [material, setMaterial] = useState<Material | null>(null);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [examPoints, setExamPoints] = useState<any[]>([]);
    const [mindMap, setMindMap] = useState<any>({ nodes: [], edges: [] });
    const [activePanel, setActivePanel] = useState<Panel>('mindmap');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('pending'); // pending, processing, completed, failed
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const loadContent = async () => {
        try {
            const [fcs, eps, mm] = await Promise.all([
                getFlashcards(id),
                getExamPoints(id),
                getMindMap(id),
            ]);
            setFlashcards(fcs);
            setExamPoints(eps);
            setMindMap(mm);

            const { data: { user } } = await supabase.auth.getUser();
            if (user && !sessionId) {
                const session = await startSession(user.id, id);
                setSessionId(session.session_id);
            }
        } catch (e) {
            console.error('Error loading content:', e);
        }
    };

    useEffect(() => {
        async function checkStatus() {
            try {
                const mat = await getMaterial(id);
                setMaterial(mat);
                setStatus(mat.status);

                if (mat.status === 'completed') {
                    if (pollInterval.current) clearInterval(pollInterval.current);
                    await loadContent();
                    setLoading(false);
                } else if (mat.status === 'failed') {
                    if (pollInterval.current) clearInterval(pollInterval.current);
                    setLoading(false);
                } else {
                    // Start polling if not already started
                    if (!pollInterval.current) {
                        pollInterval.current = setInterval(checkStatus, 3000);
                    }
                }
            } catch (e) {
                console.error('Status check failed:', e);
                setLoading(false);
                if (pollInterval.current) clearInterval(pollInterval.current);
            }
        }

        checkStatus();

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
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

    const handleReprocess = async () => {
        try {
            setLoading(true);
            await fetch(`${API_BASE}/ai/process/${id}`, { method: 'POST' });
            // Refresh after a delay
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            console.error('Reprocess failed:', e);
            setLoading(false);
        }
    };

    if (loading || status === 'pending' || status === 'processing') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', background: '#09090b' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.1)', borderTop: '3px solid #3B82F6', margin: '0 auto 2rem' }}
                />
                <h2 style={{ fontFamily: 'Outfit', color: '#F8FAFC', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {status === 'processing' ? 'AI is analyzing your notes...' : 'Preparing study session...'}
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Our AI is currently extracting key concepts, generating flashcards, and building your interactive mind map. This usually takes 20-40 seconds.
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (status === 'failed') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ fontFamily: 'Outfit', color: '#F8FAFC', marginBottom: '1rem' }}>Processing Failed</h2>
                <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>Something went wrong while analyzing your material. Please try uploading it again.</p>
                <Link href="/upload" className="btn-glow" style={{ padding: '0.8rem 1.5rem', textDecoration: 'none' }}>Go back to Upload</Link>
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
                        <AuraButton size="md" onClick={handleReprocess}>
                            🔄 Reprocess
                        </AuraButton>
                        <Link href={`/focus/${id}`} style={{ textDecoration: 'none' }}>
                            <AuraButton size="md">
                                ⚡ Focus Mode
                            </AuraButton>
                        </Link>
                        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                            <AuraButton size="md">
                                ← Back
                            </AuraButton>
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {panels.map((p) => (
                        <AuraButton
                            key={p.id}
                            size="sm"
                            active={activePanel === p.id}
                            onClick={() => setActivePanel(p.id)}
                        >
                            {p.icon} {p.label}
                        </AuraButton>
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
                                {mindMap.nodes && mindMap.nodes.length > 0 ? (
                                    <MindMap
                                        nodes={mindMap.nodes}
                                        edges={mindMap.edges}
                                        onNodeClick={handleNodeClick}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
                                        <p>No mind map nodes generated yet.</p>
                                        <button onClick={handleReprocess} style={{ marginTop: '1rem', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try re-processing →</button>
                                    </div>
                                )}
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

            <Chatbox
                materialId={id}
                initialMessage={`Hi! I've analyzed "${material?.title || 'this material'}". You can ask me to explain specific concepts or find information in the text.`}
            />
        </div>
    );
}
