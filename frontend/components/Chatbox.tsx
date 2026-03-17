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
    materialId: string;
    materialTitle: string;
}

export default function Chatbox({ materialId, materialTitle }: ChatboxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial message and auto-open listener
    useEffect(() => {
        setMessages([
            { role: 'assistant', content: `Hi! I'm Aura, your assistant for **${materialTitle}**. Ask me anything about this material!` }
        ]);

        const handleAutoOpen = () => {
            setIsCollapsed(false);
        };

        window.addEventListener('aura-chat-open', handleAutoOpen);
        return () => window.removeEventListener('aura-chat-open', handleAutoOpen);
    }, [materialTitle]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // chatWithMaterial takes (materialId, query)
            const res = await chatWithMaterial(materialId, userMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.answer,
                sources: res.sources
            }]);
        } catch (e) {
            console.error('Chat error:', e);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now."
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (isCollapsed) {
        return (
            <motion.div
                layoutId="chat-box"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setIsCollapsed(false)}
                className="chat-bubble-toggle"
                style={{
                    width: '60px', height: '60px', borderRadius: '30px',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    position: 'absolute', bottom: '2rem', right: '1.5rem',
                    zIndex: 100, fontSize: '1.5rem'
                }}
            >
                ✨
            </motion.div>
        );
    }

    return (
        <motion.div
            layoutId="chat-box"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="card chat-container"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                border: 'none',
                boxShadow: 'none',
                background: 'transparent'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--card-gradient)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34A853' }}></div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Aura Assistant</span>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    style={{
                        background: 'transparent', border: 'none', color: 'var(--muted)',
                        cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem'
                    }}
                >
                    −
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`chat-msg ${msg.role}`}
                    >
                        {msg.content}
                        {msg.sources && msg.sources.length > 0 && (
                            <div style={{
                                marginTop: '0.4rem',
                                fontSize: '0.7rem',
                                color: 'var(--muted)',
                                borderTop: '1px solid var(--border)',
                                paddingTop: '0.35rem',
                                opacity: 0.8
                            }}>
                                📍 Found in {msg.sources.length} sections
                            </div>
                        )}
                    </motion.div>
                ))}
                {loading && (
                    <div className="chat-msg assistant">
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--muted)' }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="chat-input-area" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <div className="chat-input-wrapper" style={{ display: 'flex', gap: '0.5rem', background: 'var(--input-bg)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
                    <input
                        className="chat-input"
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: '0.9rem' }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask Aura anything..."
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{ 
                            background: 'var(--primary)', color: 'white', border: 'none', 
                            borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer',
                            opacity: input.trim() ? 1 : 0.4
                        }}
                    >
                        ➔
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
