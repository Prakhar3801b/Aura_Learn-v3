'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithMaterial } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

interface ChatboxProps {
    materialId?: string;
    initialMessage?: string;
    placeholder?: string;
}

export default function Chatbox({ materialId, initialMessage, placeholder = "Ask anything about this material..." }: ChatboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialMessage && messages.length === 0) {
            setMessages([{ role: 'assistant', content: initialMessage }]);
        }
    }, [initialMessage]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading || !materialId) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await chatWithMaterial(materialId, userMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.answer,
                sources: res.sources
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I couldn't process that request. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    zIndex: 1000,
                }}
            >
                {isOpen ? '✕' : '💬'}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: 'fixed',
                            bottom: '6.5rem',
                            right: '2rem',
                            width: '380px',
                            height: '500px',
                            background: 'rgba(15, 15, 20, 0.8)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                            zIndex: 1000,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                                Aura Study Assistant
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>AI-Powered RAG retrieval</div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                        background: msg.role === 'user' ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                                        color: msg.role === 'user' ? '#FFFFFF' : '#E2E8F0',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        boxShadow: msg.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
                                    }}
                                >
                                    {msg.content}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#60A5FA', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
                                            📍 Found in {msg.sources.length} sections
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {loading && (
                                <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 2px' }}>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                                style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={placeholder}
                                    disabled={!materialId || loading}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        padding: '0.75rem 2.8rem 0.75rem 1rem',
                                        color: '#F1F5F9',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: input.trim() ? '#3B82F6' : '#475569',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    ➔
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
