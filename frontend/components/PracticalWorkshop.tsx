'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePracticalChallenge, evaluatePracticalAnswer } from '@/lib/api';
import { AuraButton } from './AuraButton';

interface PracticalWorkshopProps {
    materialId: string;
}

export default function PracticalWorkshop({ materialId }: PracticalWorkshopProps) {
    const [challenge, setChallenge] = useState<any>(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setFeedback('');
        setAnswer('');
        try {
            const data = await generatePracticalChallenge(materialId);
            setChallenge(data);
        } catch (e) {
            console.error('Failed to generate challenge:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!answer.trim()) return;
        setEvaluating(true);
        try {
            const data = await evaluatePracticalAnswer(materialId, challenge.question, answer);
            setFeedback(data.feedback);
        } catch (e) {
            console.error('Evaluation failed:', e);
        } finally {
            setEvaluating(false);
        }
    };

    const handleRequestAnswer = () => {
        setAnswer('Please provide the full 14-mark answer and explain the concepts.');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            {!challenge ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🛠️</div>
                    <h2 style={{ color: '#1A1A2E', fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem' }}>
                        Ready for Practical Application?
                    </h2>
                    <p style={{ color: '#7C7C8A', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Aura will analyze your notes and generate a real-world simulation or mini-exercise
                        to test your practical understanding of the core concepts.
                    </p>
                    <AuraButton size="lg" onClick={handleGenerate} loading={loading}>
                        Generate Practical Challenge
                    </AuraButton>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Challenge Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ padding: '2rem', borderLeft: '4px solid #7C3AED' }}
                    >
                        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                            <span className="tag-badge" style={{ textTransform: 'uppercase', fontStyle: 'italic' }}>
                                {challenge.challenge_type}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A1A2E', marginBottom: '1rem' }}>
                            {challenge.question}
                        </h3>
                        <p style={{ color: '#7C7C8A', fontSize: '0.92rem', lineHeight: 1.6 }}>
                            {challenge.instructions}
                        </p>
                    </motion.div>

                    {/* Answer Area */}
                    {!feedback ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Write your answer here, or type 'answer' to see a full explanation..."
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    padding: '1.25rem',
                                    borderRadius: '15px',
                                    border: '1px solid #E8E2DA',
                                    background: '#FAF7F2',
                                    fontSize: '0.92rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none',
                                    marginBottom: '1rem'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <AuraButton variant="outline" onClick={handleRequestAnswer}>Need help?</AuraButton>
                                <AuraButton onClick={handleEvaluate} loading={evaluating} disabled={!answer.trim()}>
                                    Submit for Assessment
                                </AuraButton>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card"
                            style={{ padding: '2rem', background: '#F8F9FF' }}
                        >
                            <div style={{ fontWeight: 800, color: '#1A1A2E', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📋 Assessment Report
                            </div>
                            <div style={{ color: '#1A1A2E', fontSize: '0.92rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                {feedback}
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                                <AuraButton variant="outline" onClick={handleGenerate}>Try Another Challenge</AuraButton>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
