'use client';

export const dynamic = 'force-dynamic';

import { use, useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { chatMulti, getMaterial } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { AuraButton } from '@/components/AuraButton';

function MultiStudyPageContent() {
    const searchParams = useSearchParams();
    const ids = searchParams.get('ids')?.split(',') || [];
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [learningLevel, setLearningLevel] = useState<string>('intermediate');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase.from('users').select('learning_level').eq('id', user.id).single();
                if (data?.learning_level) setLearningLevel(data.learning_level);
            }

            const mats = await Promise.all(ids.map(id => getMaterial(id)));
            setMaterials(mats);
            setLoading(false);

            setMessages([{
                role: 'assistant',
                content: `Welcome to your Knowledge Fusion session. I've analyzed your materials on **${mats.map(m => m.title).join(', ')}**. How can I help you connect these topics?`
            }]);
        }
        init();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || chatLoading) return;
        const q = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: q }]);
        setChatLoading(true);

        try {
            const res = await chatMulti(ids, q, user?.id);
            setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please try again.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Fusion Engine...</div>;

    return (
        <div style={{ background: '#FDFCFB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{ flex: 1, display: 'flex', padding: '2rem', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

                {/* Sidebar: Knowledge Base Info */}
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🧬</span>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1A1A2E' }}>Knowledge Fusion</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {materials.map(m => (
                                <div key={m.id} style={{
                                    padding: '0.3rem 0.6rem', background: '#F3F0EB', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#4A4A5A'
                                }}>
                                    {m.title}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: '#1A1A2E', color: 'white' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Learning Proficiency</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🏆</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'capitalize' }}>{learningLevel}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>AI-Adaptive Difficulty On</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main: Merged Chat */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid #E8E2DA', background: '#FDFCFB', fontWeight: 700 }}>
                        Fusion Chat Assistant
                    </div>

                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    background: m.role === 'user' ? '#1A1A2E' : '#F3F0EB',
                                    color: m.role === 'user' ? 'white' : '#1A1A2E',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5,
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                }}
                            >
                                {m.content}
                            </motion.div>
                        ))}
                        {chatLoading && (
                            <div style={{ alignSelf: 'flex-start', padding: '1rem', borderRadius: '16px', background: '#F3F0EB' }}>
                                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>Analysis in progress...</motion.span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '1.5rem', background: '#FDFCFB', borderTop: '1px solid #E8E2DA' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask about the connection between these materials..."
                                style={{
                                    flex: 1,
                                    height: '3rem',
                                    padding: '0 1.25rem',
                                    borderRadius: '12px',
                                    border: '1px solid #E8E2DA',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <AuraButton
                                variant="primary"
                                size="lg"
                                onClick={handleSendMessage}
                                loading={chatLoading}
                            >
                                Ask Fusion AI
                            </AuraButton>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function MultiStudyPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Fusion Engine...</div>}>
            <MultiStudyPageContent />
        </Suspense>
    );
}
