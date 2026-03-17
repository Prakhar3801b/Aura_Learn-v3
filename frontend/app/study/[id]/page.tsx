'use client';

import { useEffect, useState, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Flashcards from '@/components/Flashcards';
import ExamPoints from '@/components/ExamPoints';
import SimulationPlayer from '@/components/SimulationPlayer';
import { 
    getFlashcards, 
    getExamPoints, 
    getMindMap, 
    getConceptGraph, 
    getMaterial, 
    updateFlashcardConfidence, 
    startSession, 
    recordEvent, 
    deleteMaterial,
    Material, 
    API_BASE 
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { AuraButton } from '@/components/AuraButton';

const MindMap = dynamic(() => import('@/components/MindMap'), { ssr: false });
const ConceptGraph = dynamic(() => import('@/components/ConceptGraph'), { ssr: false });

import PracticalWorkshop from '@/components/PracticalWorkshop';

type Panel = 'mindmap' | 'conceptgraph' | 'flashcards' | 'exampoints' | 'practical' | 'simulation';

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [material, setMaterial] = useState<Material | null>(null);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [examPoints, setExamPoints] = useState<any[]>([]);
    const [mindMap, setMindMap] = useState<any>({ nodes: [], edges: [] });
    const [conceptGraph, setConceptGraph] = useState<any>({ nodes: [], edges: [] });
    const [activePanel, setActivePanel] = useState<Panel>('mindmap');
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('pending');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const [learningLevel, setLearningLevel] = useState<string>('intermediate');

    const loadContent = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('users').select('learning_level').eq('id', user.id).single();
                if (data?.learning_level) setLearningLevel(data.learning_level);
            }

            const [fcs, eps, mm, cg] = await Promise.all([
                getFlashcards(id),
                getExamPoints(id),
                getMindMap(id),
                getConceptGraph(id)
            ]);
            setFlashcards(fcs);
            setExamPoints(eps);
            setMindMap(mm);
            setConceptGraph(cg);

            if (user && !sessionId) {
                const session = await startSession(user.id, id);
                setSessionId(session.session_id);
            }
        } catch (e) {
            console.error('Error loading content:', e);
        }
    };

    useEffect(() => {
        if (!loading && material) {
            // Initialize chat with material data
            window.dispatchEvent(new CustomEvent('aura-chat-init', {
                detail: { id: id, title: material.title }
            }));

            // Trigger aura-chat-open event for the automated pop-out
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('aura-chat-open', {
                    detail: { id: id, title: material.title }
                }));
            }, 800);
        }
    }, [loading, material, id]);

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

    const handleDelete = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setDeleting(true);
        try {
            await deleteMaterial(id, user.id);
            router.push('/dashboard');
        } catch (e) {
            console.error('Delete failed:', e);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const panels: { id: Panel; label: string; icon: string }[] = [
        { id: 'mindmap', label: 'Mind Map', icon: '🧠' },
        { id: 'conceptgraph', label: 'Concept Graph', icon: '🕸️' },
        { id: 'simulation', label: 'Simulation', icon: '🎬' },
        { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: '⚡' },
        { id: 'exampoints', label: `Revision Sheet (${examPoints.length})`, icon: '📜' },
        { id: 'practical', label: 'Practical Workshop', icon: '🛠️' },
    ];

    const handleReprocess = async () => {
        try {
            setLoading(true);
            await fetch(`${API_BASE}/ai/process/${id}`, { method: 'POST' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            console.error('Reprocess failed:', e);
            setLoading(false);
        }
    };

    if (loading || status === 'pending' || status === 'processing') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid #E8E2DA', borderTop: '3px solid #1A1A2E', margin: '0 auto 1.5rem' }}
                />
                <h2 style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    {status === 'processing' ? 'AI is analyzing your notes...' : 'Preparing study session...'}
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    Extracting key concepts, generating flashcards, and building your interactive mind map. This usually takes 20-40 seconds.
                </p>
            </div>
        </div>
    );

    if (status === 'failed') return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
                <h2 style={{ color: 'var(--text)', marginBottom: '0.75rem' }}>Processing Failed</h2>
                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Something went wrong. Please try uploading again.</p>
                <Link href="/upload"><AuraButton variant="primary">Go back to Upload</AuraButton></Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>
                                {material?.title || 'Study Session'}
                            </h1>
                            <div style={{
                                padding: '0.2rem 0.6rem', background: 'var(--primary)', color: 'var(--bg)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase'
                            }}>
                                🏆 {learningLevel}
                            </div>
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                            {flashcards.length} flashcards · {examPoints.length} exam points · {mindMap.nodes.length} nodes
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <AuraButton size="sm" onClick={handleReprocess}>🔄 Reprocess</AuraButton>
                        <Link href={`/focus/${id}`} style={{ textDecoration: 'none' }}>
                            <AuraButton size="sm">⚡ Focus</AuraButton>
                        </Link>
                        <AuraButton 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowDeleteConfirm(true)}
                            style={{ color: '#EA4335', borderColor: '#EA4335' }}
                        >
                            ✕ Delete
                        </AuraButton>
                        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                            <AuraButton size="sm">← Back</AuraButton>
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
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
            <div style={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePanel}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="card"
                        style={{
                            height: (activePanel === 'mindmap' || activePanel === 'conceptgraph') ? '65vh' : 'auto',
                            minHeight: '400px',
                            padding: (activePanel === 'mindmap' || activePanel === 'conceptgraph') ? '0' : '1.5rem',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {activePanel === 'mindmap' && (
                            <div style={{ height: '100%' }}>
                                {mindMap.nodes && mindMap.nodes.length > 0 ? (
                                    <MindMap nodes={mindMap.nodes} edges={mindMap.edges} onNodeClick={handleNodeClick} />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧠</div>
                                        <p>No mind map nodes generated yet.</p>
                                        <button onClick={handleReprocess} style={{ marginTop: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>Try re-processing →</button>
                                    </div>
                                )}
                            </div>
                        )}
                        {activePanel === 'conceptgraph' && (
                            <div style={{ height: '100%' }}>
                                {conceptGraph.nodes && conceptGraph.nodes.length > 0 ? (
                                    <ConceptGraph nodes={conceptGraph.nodes} edges={conceptGraph.edges} onNodeClick={handleNodeClick} />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🕸️</div>
                                        <p>No concept graph nodes generated yet.</p>
                                        <button onClick={handleReprocess} style={{ marginTop: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>Try re-processing →</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activePanel === 'simulation' && (
                            <SimulationPlayer materialId={id} />
                        )}

                        {/* Node Detail Drawer for both Graph types */}
                        {(activePanel === 'mindmap' || activePanel === 'conceptgraph') && (
                            <AnimatePresence>
                                {selectedNode && (
                                    <motion.div
                                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 25 }}
                                        style={{
                                            position: 'absolute', top: 0, right: 0, bottom: 0, width: '280px',
                                            background: 'var(--surface)',
                                            borderLeft: '1px solid var(--border)',
                                            padding: '1.5rem',
                                            overflowY: 'auto',
                                            boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
                                            zIndex: 10
                                        }}
                                    >
                                        <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.6rem', paddingRight: '1.5rem' }}>{selectedNode.label}</div>
                                        {selectedNode.description && (
                                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedNode.description}</p>
                                        )}
                                        {selectedNode.node_type === 'relation' && (
                                            <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', background: 'var(--pastel-peach)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>Relationship</div>
                                        )}
                                        {selectedNode.video_timestamp_label && (
                                            <div style={{ background: 'var(--pastel-cream)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.7rem', marginTop: '1rem' }}>
                                                <div style={{ color: '#8B6914', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.2rem' }}>⏱ Video Timestamp</div>
                                                <div style={{ color: 'var(--text)', fontWeight: 700 }}>{selectedNode.video_timestamp_label}</div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {activePanel === 'flashcards' && (
                            <Flashcards flashcards={flashcards} onConfidenceUpdate={handleConfidenceUpdate} />
                        )}
                        {activePanel === 'exampoints' && (
                            <ExamPoints examPoints={examPoints} />
                        )}
                        {activePanel === 'practical' && (
                            <PracticalWorkshop materialId={id} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 999,
                        }}
                        onClick={() => !deleting && setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--surface)',
                                borderRadius: '20px',
                                padding: '2rem',
                                maxWidth: '400px',
                                width: '90%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                Delete this material?
                            </h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                This will permanently remove "{material?.title}" and all its study data. This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <AuraButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </AuraButton>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    style={{
                                        background: '#EA4335',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '0.5rem 1.25rem',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: deleting ? 'not-allowed' : 'pointer',
                                        opacity: deleting ? 0.6 : 1,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
