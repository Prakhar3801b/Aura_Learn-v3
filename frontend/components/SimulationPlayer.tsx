'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSimulation } from '@/lib/api';
import { AuraButton } from './AuraButton';

interface SimulationStep {
    step_number: number;
    narration: string;
    elements: Array<{ id: string; label: string; state: string }>;
    annotations: Array<{ text: string; position: 'top' | 'bottom' }>;
}

interface SimulationData {
    title: string;
    subject_area: string;
    description: string;
    visual_type: string;
    steps: SimulationStep[];
}

export default function SimulationPlayer({ materialId }: { materialId: string }) {
    const [data, setData] = useState<SimulationData | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        generateSimulation(materialId)
            .then(res => {
                setData(res);
                setError(null);
            })
            .catch(err => {
                setError(err.message || 'Failed to generate simulation');
            })
            .finally(() => setLoading(false));
    }, [materialId]);

    if (loading) {
        return (
            <div className="card shimmer" style={{ height: '400px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
                    <p style={{ fontWeight: 600 }}>AI is visualizing the concept...</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Analyzing material for simulation-ready content</p>
                </div>
            </div>
        );
    }

    if (error || !data || !data.steps || data.steps.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>❌</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Simulation Unavailable</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{error || 'This material might not be suitable for simulation yet.'}</p>
                <AuraButton variant="outline" onClick={() => window.location.reload()}>Retry Generation</AuraButton>
            </div>
        );
    }

    const step = data.steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === data.steps.length - 1;

    const renderVisual = () => {
        const visualType = data.visual_type;
        
        switch (visualType) {
            case 'array':
            case 'comparison':
                return (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {step.elements.map((el) => (
                            <motion.div
                                key={`${el.id}-${currentStep}`}
                                layoutId={el.id}
                                className={`sim-element-box ${el.state}`}
                            >
                                {el.label}
                            </motion.div>
                        ))}
                    </div>
                );
            case 'graph':
            case 'tree':
            case 'process_flow':
            case 'cycle':
            case 'timeline':
                const isCircle = visualType === 'graph' || visualType === 'cycle';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', padding: '1rem' }}>
                            {step.elements.map((el, i) => (
                                <div key={el.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`sim-element-box ${el.state}`}
                                        style={{ 
                                            borderRadius: isCircle ? '50%' : '10px',
                                            zIndex: 2
                                        }}
                                    >
                                        {el.label}
                                    </motion.div>
                                    {i < step.elements.length - 1 && visualType !== 'graph' && (
                                        <div style={{ 
                                            width: '1.5rem', 
                                            height: '2px', 
                                            background: 'var(--border)', 
                                            margin: '0 -0.5rem',
                                            zIndex: 1
                                        }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {step.elements.map((el) => (
                            <motion.div key={el.id} className={`sim-element-box ${el.state}`}>
                                {el.label}
                            </motion.div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sim-player">
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span className="tag-badge" style={{ marginBottom: '0.5rem', background: 'var(--pastel-sky)', color: 'var(--primary)' }}>
                            {data.subject_area || 'General'}
                        </span>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--text)', fontSize: '1.4rem' }}>{data.title}</h2>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                        STEP {currentStep + 1} / {data.steps.length}
                    </div>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{data.description}</p>
            </div>

            <div className="sim-canvas">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {renderVisual()}
                        
                        {step.annotations && step.annotations.length > 0 && (
                            <div className="sim-annotation">
                                {step.annotations.map((ann, i) => (
                                    <div key={i}>{ann.text}</div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="sim-narration">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.2rem' }}>🎙️</div>
                    <div style={{ flex: 1, fontWeight: 500 }}>{step.narration}</div>
                </div>
            </div>

            <div className="sim-progress">
                <div 
                    className="sim-progress-bar" 
                    style={{ width: `${((currentStep + 1) / data.steps.length) * 100}%` }} 
                />
            </div>

            <div className="sim-controls">
                <button onClick={() => setCurrentStep(0)} disabled={isFirst}>
                    Beginning
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={isFirst}>
                        ← Back
                    </button>
                    <button 
                        onClick={() => setCurrentStep(prev => Math.min(data.steps.length - 1, prev + 1))} 
                        disabled={isLast} 
                        style={{ background: 'var(--primary)', color: 'var(--bg)', border: 'none' }}
                    >
                        Next Step →
                    </button>
                </div>
                <button onClick={() => setCurrentStep(data.steps.length - 1)} disabled={isLast}>
                    End
                </button>
            </div>
        </motion.div>
    );
}
