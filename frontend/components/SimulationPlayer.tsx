'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSimulation } from '@/lib/api';
import { AuraButton } from './AuraButton';

// Import specialized renderers
import FlowRenderer from './simulations/FlowRenderer';
import ArrayRenderer from './simulations/ArrayRenderer';
import GraphRenderer from './simulations/GraphRenderer';
import SystemRenderer from './simulations/SystemRenderer';
import MolecularRenderer from './simulations/MolecularRenderer';

interface Animation {
  type: 'move' | 'highlight' | 'transform' | 'scale' | 'rotate' | 'pulse';
  target: string;
  from?: string;
  to?: string;
  duration: number;
  style?: any;
}

interface SimulationStep {
  step: number;
  step_title: string;
  narration: string;
  animations: Animation[];
}

interface SimulationData {
  title: string;
  concept_summary: string;
  domain: string;
  simulation_type: 'array' | 'flow' | 'graph' | 'system' | 'molecular';
  components: any[];
  connections: any[];
  entities: any[];
  steps: SimulationStep[];
  controls: string[];
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

    const renderSelectedRenderer = () => {
        if (!data) return null;
        
        const props = { data, currentStep };
        
        switch (data.simulation_type) {
            case 'flow': return <FlowRenderer {...props} />;
            case 'array': return <ArrayRenderer {...props} />;
            case 'graph': return <GraphRenderer {...props} />;
            case 'system': return <SystemRenderer {...props} />;
            case 'molecular': return <MolecularRenderer {...props} />;
            default: return <FlowRenderer {...props} />;
        }
    };

    if (loading) {
        return (
            <div className="card shimmer" style={{ height: '400px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-bounce" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔬</div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Constructing Simulation Plan...</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>AI is Architecting the visual logic</p>
                </div>
            </div>
        );
    }

    if (error || !data || !data.steps || data.steps.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Planner Error</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{error || 'The simulation plan could not be generated for this material.'}</p>
                <AuraButton variant="outline" onClick={() => window.location.reload()}>Retry Planning</AuraButton>
            </div>
        );
    }

    const step = data.steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === data.steps.length - 1;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sim-player premium-shadow rounded-2xl p-6 bg-surface/30 backdrop-blur-sm border border-border">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span className="tag-badge bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 inline-block">
                            {data.domain} • {data.simulation_type}
                        </span>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, color: 'var(--text)', fontSize: '1.6rem', letterSpacing: '-0.02em' }}>{data.title}</h2>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                        <span className="text-primary">{currentStep + 1}</span> / {data.steps.length}
                    </div>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>{data.concept_summary}</p>
            </div>

            {/* Renderer Canvas */}
            <div className="sim-canvas bg-bg/20 rounded-xl p-4 border border-border/50 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ width: '100%' }}
                    >
                        {renderSelectedRenderer()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Narration Drawer */}
            <div className="sim-narration mt-6 p-5 bg-surface/50 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow duration-300">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl shadow-inner">💡</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                            {step.step_title}
                        </div>
                        <div style={{ fontWeight: 600, lineHeight: 1.7, fontSize: '1rem', color: 'var(--text)' }}>
                            {step.narration}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress & Controls */}
            <div className="mt-8">
                <div className="bg-border/20 h-1.5 w-full rounded-full overflow-hidden mb-6">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-secondary" 
                        animate={{ width: `${((currentStep + 1) / data.steps.length) * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-center gap-4">
                    <AuraButton 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentStep(0)} 
                        disabled={isFirst}
                    >
                        ⏮ Reset
                    </AuraButton>
                    
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <AuraButton 
                            variant="outline" 
                            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} 
                            disabled={isFirst}
                        >
                            ← Prev
                        </AuraButton>
                        <AuraButton 
                            variant="primary" 
                            className="min-w-[140px]"
                            onClick={() => setCurrentStep(prev => Math.min(data.steps.length - 1, prev + 1))} 
                            disabled={isLast} 
                        >
                            {isLast ? 'Complete' : 'Next Step →'}
                        </AuraButton>
                    </div>

                    <AuraButton 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentStep(data.steps.length - 1)} 
                        disabled={isLast}
                    >
                        ⏭ Finish
                    </AuraButton>
                </div>
            </div>
        </motion.div>
    );
}

