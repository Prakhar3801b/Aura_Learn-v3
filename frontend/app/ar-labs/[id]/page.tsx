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
        <a-entity position="0 0 -2">${entities}</a-entity>
        <a-sky color="#FAF7F2"></a-sky>
      </a-scene>
    `;
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #E8E2DA', borderTop: '3px solid #1A1A2E', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: '#7C7C8A' }}>Loading AR Lab...</p>
            </div>
        </div>
    );

    if (!lab) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#7C7C8A' }}>Lab not found.</p>
                <Link href="/ar-labs" style={{ color: '#1A1A2E', display: 'block', marginTop: '0.75rem' }}>← Back to Labs</Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '2rem 2.5rem' }}>
            <div style={{ maxWidth: '900px' }}>
                <Link href="/ar-labs" style={{ color: '#7C7C8A', textDecoration: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    ← All AR Labs
                </Link>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <span className="tag-badge" style={{ background: '#E8D5F5', borderColor: '#D4BEE8', color: '#6B21A8' }}>{lab.category}</span>
                        <span className="tag-badge">⏱ ~{lab.duration_minutes} min</span>
                        <span className="tag-badge" style={{ background: '#D4F5E9', borderColor: '#B8E8D4', color: '#1A6B3C' }}>{lab.difficulty}</span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1A1A2E', marginBottom: '0.5rem' }}>{lab.name}</h1>
                    <p style={{ color: '#7C7C8A', lineHeight: 1.6, maxWidth: '560px', marginBottom: '1.75rem', fontSize: '0.9rem' }}>{lab.description}</p>
                </motion.div>

                {/* AR Viewer */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                    style={{ padding: '0', overflow: 'hidden', marginBottom: '1.75rem' }}
                >
                    {!arStarted ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🥽</div>
                            <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#1A1A2E', marginBottom: '0.6rem' }}>
                                Ready to Enter AR?
                            </h2>
                            <p style={{ color: '#7C7C8A', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                Best on Chrome for Android. Grant camera access when prompted.
                            </p>
                            <p style={{ color: '#7C7C8A', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                                Point your camera at a flat surface to place the experiment.
                            </p>
                            <button
                                id="enter-ar"
                                onClick={() => setArStarted(true)}
                                className="btn-primary"
                                style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}
                            >
                                🥽 Start AR Lab
                            </button>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <div
                                id="ar-container"
                                style={{ width: '100%', height: '400px', background: '#FAF7F2' }}
                                dangerouslySetInnerHTML={{ __html: buildAFrameScene(lab) }}
                            />
                            <button
                                onClick={() => setArStarted(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.9)', border: '1px solid #E8E2DA', borderRadius: '8px', color: '#1A1A2E', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem' }}
                            >
                                Exit AR
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Instructions & Learning Outcomes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.25rem' }}>
                    <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A2E', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            📋 How to Use
                        </h3>
                        <ol style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lab.scene.instructions.map((step: string, i: number) => (
                                <li key={i} style={{ color: '#7C7C8A', fontSize: '0.82rem', lineHeight: 1.6 }}>{step}</li>
                            ))}
                        </ol>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#1A1A2E', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🎓 Learning Outcomes
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lab.scene.learning_outcomes.map((outcome: string, i: number) => (
                                <li key={i} style={{ color: '#7C7C8A', fontSize: '0.82rem', lineHeight: 1.6, display: 'flex', gap: '0.4rem' }}>
                                    <span style={{ color: '#34A853', flexShrink: 0 }}>✓</span>
                                    {outcome}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {lab.tags?.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginTop: '1.25rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {lab.tags.map((tag: string) => <span key={tag} className="tag-badge">{tag}</span>)}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
