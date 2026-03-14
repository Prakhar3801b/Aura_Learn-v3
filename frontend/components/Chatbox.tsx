'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithMaterial } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

interface ChatSidebarProps {
    materialId?: string;
    initialMessage?: string;
    placeholder?: string;
}

export default function ChatSidebar({
    materialId,
    initialMessage = "Hi! I'm Aura, your AI study assistant. Upload a document and I'll help you master the content!",
    placeholder = "Ask anything..."
}: ChatSidebarProps) {
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
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        if (materialId) {
            try {
                const res = await chatWithMaterial(materialId, userMsg);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: res.answer,
                    sources: res.sources
                }]);
            } catch {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I'm sorry, I couldn't process that. Please try again."
                }]);
            }
        } else {
            // No material selected — provide a helpful default response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Upload a study material first, then I can help you dive deep into the content with AI-powered answers!"
            }]);
        }
        setLoading(false);
    };

    return (
        <aside className="chat-sidebar">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-title">
                    <span className="chat-online-dot"></span>
                    Aura Assistant
                </div>
                <div className="chat-header-subtitle">AI-Powered Study Help</div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="chat-messages">
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
                                color: '#7C7C8A',
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                paddingTop: '0.35rem'
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
                                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C7C8A' }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <input
                        className="chat-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={placeholder}
                        disabled={loading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{ opacity: input.trim() ? 1 : 0.3 }}
                    >
                        ➔
                    </button>
                </div>
            </div>
        </aside>
    );
}
