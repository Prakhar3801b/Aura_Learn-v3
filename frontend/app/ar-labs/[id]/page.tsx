'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getARLab } from '@/lib/api';

export default function ARLabPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [lab, setLab] = useState<any>(null);
    const [arStarted, setArStarted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getARLab(id).then(setLab).finally(() => setLoading(false));
        // Load A-Frame
        const script = document.createElement('script');
        script.src = 'https://aframe.io/releases/1.5.0/aframe.min.js';
        script.async = true;
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, [id]);

    const buildAFrameScene = (lab: any): string => {
        if (!lab?.scene?.entities) return '';
        const entities = lab.scene.entities
            .map((e: any) => {
                const attrs = Object.entries(e)
                    .filter(([k]) => k !== 'type')
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(' ');
                return `<a-${e.type} ${attrs}></a-${e.type}>`;
            })
            .join('\n        ');

        return `
      <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;" renderer="logarithmicDepthBuffer: true;" vr-mode-ui="enterVRButton: #enter-ar">
        <a-camera gps-camera rotation-reader></a-camera>
        <a-entity position="0 0 -2">
          ${entities}
        </a-entity>
        <a-sky color="#000000"></a-sky>
      </a-scene>
    `;
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid #3B82F6', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: '#94A3B8' }}>Loading AR Lab...</p>
            </div>
        </div>
    );

    if (!lab) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94A3B8' }}>Lab not found.</p>
                <Link href="/ar-labs" style={{ color: '#3B82F6', display: 'block', marginTop: '1rem' }}>← Back to Labs</Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                {/* Back */}
                <Link href="/ar-labs" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    ← All AR Labs
                </Link>

                {/* Lab Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '99px', color: '#A78BFA', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {lab.category}
                        </span>
                        <span style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '99px', color: '#94A3B8', fontSize: '0.72rem', padding: '0.25rem 0.8rem' }}>
                            ⏱ ~{lab.duration_minutes} min
                        </span>
                        <span style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '99px', color: '#10B981', fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.8rem' }}>
                            {lab.difficulty}
                        </span>
                    </div>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '0.6rem' }}>{lab.name}</h1>
                    <p style={{ color: '#94A3B8', lineHeight: 1.6, maxWidth: '600px', marginBottom: '2rem' }}>{lab.description}</p>
                </motion.div>

                {/* AR Viewer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-card"
                    style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}
                >
                    {!arStarted ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥽</div>
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', color: '#F1F5F9', marginBottom: '0.75rem' }}>
                                Ready to Enter AR?
                            </h2>
                            <p style={{ color: '#94A3B8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Best on Chrome for Android. Grant camera access when prompted.
                            </p>
                            <p style={{ color: '#94A3B8', marginBottom: '2rem', fontSize: '0.82rem' }}>
                                Point your camera at a flat surface to place the experiment.
                            </p>
                            <button
                                id="enter-ar"
                                onClick={() => setArStarted(true)}
                                className="btn-glow"
                                style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}
                            >
                                🥽 Start AR Lab
                            </button>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* A-Frame Scene */}
                            <div
                                id="ar-container"
                                style={{ width: '100%', height: '420px', background: '#000' }}
                                dangerouslySetInnerHTML={{
                                    __html: buildAFrameScene(lab),
                                }}
                            />
                            <button
                                onClick={() => setArStarted(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                Exit AR
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Instructions & Learning Outcomes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {/* Instructions */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass-card" style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#F1F5F9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📋 How to Use
                        </h3>
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {lab.scene.instructions.map((step: string, i: number) => (
                                <li key={i} style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6 }}>{step}</li>
                            ))}
                        </ol>
                    </motion.div>

                    {/* Learning Outcomes */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#F1F5F9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🎓 Learning Outcomes
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {lab.scene.learning_outcomes.map((outcome: string, i: number) => (
                                <li key={i} style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>
                                    {outcome}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Tags */}
                {lab.tags?.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {lab.tags.map((tag: string) => <span key={tag} className="tag-badge">{tag}</span>)}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
