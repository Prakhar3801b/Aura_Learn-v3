'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuraButton } from './AuraButton';

interface Question {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface QuizProps {
    questions: Question[];
}

export default function Quiz({ questions }: QuizProps) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswer = (option: string) => {
        if (showExplanation) return;
        setSelectedOption(option);
        setShowExplanation(true);
        if (option === questions[currentIdx].answer) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        }
    };

    if (!questions || questions.length === 0) return <div>No quiz available for this material.</div>;

    const q = questions[currentIdx];

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Active Recall Quiz</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Question {currentIdx + 1} of {questions.length}</span>
            </div>

            <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>{q.question}</p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {q.options.map((option, i) => {
                        let borderColor = 'var(--border)';
                        let bgColor = 'transparent';
                        if (showExplanation) {
                            if (option === q.answer) {
                                borderColor = '#34A853';
                                bgColor = 'rgba(52, 168, 83, 0.1)';
                            } else if (option === selectedOption) {
                                borderColor = '#EA4335';
                                bgColor = 'rgba(234, 67, 53, 0.1)';
                            }
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(option)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${borderColor}`,
                                    background: bgColor,
                                    textAlign: 'left',
                                    cursor: showExplanation ? 'default' : 'pointer',
                                    fontSize: '0.95rem',
                                    color: 'var(--text)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: 500
                                }}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'var(--input-bg)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            borderLeft: `4px solid ${selectedOption === q.answer ? '#34A853' : '#EA4335'}`
                        }}
                    >
                        <p style={{ fontWeight: 700, margin: '0 0 0.5rem 0', color: selectedOption === q.answer ? '#34A853' : '#EA4335' }}>
                            {selectedOption === q.answer ? '✨ Correct!' : '❌ Incorrect'}
                        </p>
                        <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {showExplanation && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {currentIdx < questions.length - 1 ? (
                        <AuraButton onClick={nextQuestion}>Next Question →</AuraButton>
                    ) : (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p style={{ fontWeight: 700 }}>Quiz Complete! Score: {score}/{questions.length}</p>
                            <AuraButton onClick={() => window.location.reload()}>Finish</AuraButton>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
