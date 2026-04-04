'use client';

import { useEffect, useState, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExamPoints from '@/components/ExamPoints';
import SimulationPlayer from '@/components/SimulationPlayer';
import Quiz from '@/components/Quiz';
import Glossary from '@/components/Glossary';
import ExternalResources from '@/components/ExternalResources';
import { 
    getFlashcards, 
    getExamPoints, 
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

import PracticalWorkshop from '@/components/PracticalWorkshop';

type Panel = 'quiz' | 'glossary' | 'flashcards' | 'exampoints' | 'practical' | 'simulation' | 'resources';

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [material, setMaterial] = useState<Material | null>(null);
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [examPoints, setExamPoints] = useState<any[]>([]);
    const [quiz, setQuiz] = useState<any[]>([]);
    const [glossary, setGlossary] = useState<any[]>([]);
    const [resources, setResources] = useState<any>(null);
    const [activePanel, setActivePanel] = useState<Panel>('flashcards');
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

            const [fcs, eps] = await Promise.all([
                getFlashcards(id),
                getExamPoints(id),
            ]);
            setFlashcards(fcs);
            setExamPoints(eps);

            // Fetch new tools lazily or on demand if needed, but let's do them here for simplicity
            try {
                const [q, g, r] = await Promise.all([
                    fetch(`${API_BASE}/ai/quiz/${id}`).then(res => res.json()),
                    fetch(`${API_BASE}/ai/glossary/${id}`).then(res => res.json()),
                    fetch(`${API_BASE}/ai/resources/${id}`).then(res => res.json())
                ]);
                setQuiz(q);
                setGlossary(g);
                setResources(r);
            } catch (err) {
                console.error("Failed to load new study tools:", err);
            }

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
        { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: '⚡' },
        { id: 'quiz', label: 'Active Recall Quiz', icon: '📝' },
        { id: 'glossary', label: 'Key Concepts', icon: '📚' },
        { id: 'simulation', label: 'Simulation', icon: '🎬' },
        { id: 'exampoints', label: `Revision Sheet (${examPoints.length})`, icon: '📜' },
        { id: 'practical', label: 'Practical Workshop', icon: '🛠️' },
        { id: 'resources', label: 'Related Resources', icon: '🌐' },
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
                    style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', margin: '0 auto 1.5rem' }}
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
                            {flashcards.length} flashcards · {examPoints.length} exam points · {quiz.length} quiz questions
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
                            height: 'auto',
                            minHeight: '400px',
                            padding: '1.5rem',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {activePanel === 'quiz' && (
                            <Quiz questions={quiz} />
                        )}
                        {activePanel === 'glossary' && (
                            <Glossary terms={glossary} />
                        )}
                        {activePanel === 'resources' && (
                            <ExternalResources resources={resources} />
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
                    <div className="modal-backdrop" onClick={() => !deleting && setShowDeleteConfirm(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="modal-content"
                            style={{ textAlign: 'center' }}
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
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
