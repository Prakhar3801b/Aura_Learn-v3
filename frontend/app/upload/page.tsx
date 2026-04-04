'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, Accept } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { uploadMaterial } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AuraButton } from '@/components/AuraButton';

const ACCEPTED_TYPES: Accept = {
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
};

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [type, setType] = useState<'file' | 'link'>('file');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const onDrop = useCallback((accepted: File[]) => {
        if (accepted[0]) {
            setFile(accepted[0]);
            setTitle(accepted[0].name.replace(/\.[^.]+$/, ''));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        maxFiles: 1,
        maxSize: 500 * 1024 * 1024,
    });

    const getIcon = (f: File) => {
        if (f.type.includes('pdf')) return '📄';
        if (f.type.includes('image')) return '🖼️';
        if (f.type.includes('video')) return '🎬';
        return '📁';
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleUpload = async () => {
        if (type === 'file' && (!file || !title.trim())) return;
        if (type === 'link' && (!url.trim() || !title.trim())) return;
        setError('');
        setUploading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Please sign in to upload'); setUploading(false); return; }

        const progressInterval = setInterval(() => {
            setProgress((p) => Math.min(p + 8, 85));
        }, 400);

        try {
            let result;
            if (type === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', title.trim());
                formData.append('user_id', user.id);
                result = await uploadMaterial(formData);
            } else {
                const res = await fetch(`${supabase.supabaseUrl.replace('supabase.co', 'supabase.co')}/functions/v1/aura-api` ? "" : "", { // Placeholder for API base logic if needed, but I'll use direct fetch
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, title: title.trim(), user_id: user.id })
                });
                // Using the actual backend endpoint:
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/materials/url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, title: title.trim(), user_id: user.id })
                });
                if (!response.ok) throw new Error("URL processing failed");
                result = await response.json();
            }

            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => router.push(`/study/${result.id}`), 800);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
            <div style={{ maxWidth: '600px' }}>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1A1A2E', marginBottom: '0.4rem' }}>
                        Upload Study Material
                    </h1>
                    <p style={{ color: '#7C7C8A', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        PDF, image (handwritten notes), or video lecture — our AI processes everything.
                    </p>
                </motion.div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button 
                        onClick={() => setType('file')}
                        style={{ 
                            padding: '0.6rem 1.25rem', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: type === 'file' ? 'var(--primary)' : 'var(--input-bg)',
                            color: type === 'file' ? 'white' : 'var(--text)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        📁 File Upload
                    </button>
                    <button 
                        onClick={() => setType('link')}
                        style={{ 
                            padding: '0.6rem 1.25rem', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: type === 'link' ? 'var(--primary)' : 'var(--input-bg)',
                            color: type === 'link' ? 'white' : 'var(--text)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        🔗 Paste Link
                    </button>
                </div>

                {/* Dropzone or URL Input */}
                {type === 'file' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        {...(getRootProps() as any)}
                        className="card"
                        style={{
                            border: `2px dashed ${isDragActive ? '#1A1A2E' : file ? '#34A853' : '#E8E2DA'}`,
                            borderRadius: '16px',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: isDragActive ? 'rgba(26,26,46,0.03)' : file ? 'rgba(52,168,83,0.04)' : '#FFFFFF',
                            transition: 'all 0.3s ease',
                            marginBottom: '1.5rem',
                            boxShadow: 'none',
                        }}
                    >
                        <input {...getInputProps()} />
                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>{getIcon(file)}</div>
                                    <div style={{ fontWeight: 600, color: '#34A853', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{file.name}</div>
                                    <div style={{ color: '#7C7C8A', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace" }}>{formatSize(file.size)}</div>
                                    <div style={{ color: '#7C7C8A', fontSize: '0.78rem', marginTop: '0.4rem' }}>Click to change file</div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>☁️</div>
                                    <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '1rem', marginBottom: '0.4rem' }}>
                                        {isDragActive ? 'Drop it here!' : 'Drag & drop your file'}
                                    </div>
                                    <div style={{ color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.8rem' }}>or click to browse</div>
                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {['PDF', 'PNG/JPG', 'MP4/WebM'].map((t) => (
                                            <span key={t} className="tag-badge">{t}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.6rem' }}>Study Material URL</label>
                            <input
                                className="aura-input"
                                placeholder="Paste YouTube link, ResearchGate paper, or article URL..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                style={{ fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                             {['🎬 YouTube', '🎓 ResearchGate', '📖 W3Schools', '💻 GeeksforGeeks'].map(s => (
                                 <span key={s} style={{ fontSize: '0.75rem', background: 'var(--input-bg)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)', color: 'var(--muted)' }}>{s}</span>
                             ))}
                        </div>
                    </motion.div>
                )}

                {/* Title Input */}
                {(file || url) && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: '#7C7C8A', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Material Title</label>
                        <input
                            className="aura-input"
                            placeholder="e.g. Chapter 4 — Thermodynamics"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </motion.div>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ color: '#7C7C8A', fontSize: '0.82rem' }}>
                                {progress < 100 ? 'Uploading & processing...' : '✓ Complete! Redirecting...'}
                            </span>
                            <span style={{ color: '#1A1A2E', fontSize: '0.82rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{progress}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#E8E2DA', borderRadius: '99px', overflow: 'hidden' }}>
                            <motion.div
                                className="progress-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ background: '#FFD6D6', border: '1px solid #FFBDBD', borderRadius: '10px', padding: '0.7rem 1rem', color: '#B91C1C', fontSize: '0.82rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {/* Submit */}
                <AuraButton
                    variant="primary"
                    size="lg"
                    onClick={handleUpload}
                    disabled={(type === 'file' ? !file : !url.trim()) || !title.trim() || uploading}
                    style={{ width: '100%' }}
                >
                    {uploading ? 'Processing...' : 'Upload & Analyze with AI →'}
                </AuraButton>

                {/* Info blurb */}
                <div style={{ marginTop: '1.5rem', background: '#D5E8F5', border: '1px solid #BDD8ED', borderRadius: '12px', padding: '1rem 1.2rem' }}>
                    <p style={{ color: '#1A5276', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        ✦ <strong>After upload</strong>, our AI will extract text (OCR for images, Whisper for videos),
                        generate flashcards, exam points, and an interactive mind map — all automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}
