'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, Accept } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { uploadMaterial } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
        if (!file || !title.trim()) return;
        setError('');
        setUploading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Please sign in to upload'); setUploading(false); return; }

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress((p) => Math.min(p + 8, 85));
        }, 400);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title.trim());
            formData.append('user_id', user.id);

            const result = await uploadMaterial(formData);
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => router.push(`/study/${result.id}`), 800);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', padding: '100px 2rem 4rem' }}>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: '#F1F5F9', marginBottom: '0.5rem' }}>
                        Upload Study Material
                    </h1>
                    <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>
                        PDF, image (handwritten notes), or video lecture — our AI processes everything.
                    </p>
                </motion.div>

                {/* Dropzone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    {...(getRootProps() as any)}
                    style={{
                        border: `2px dashed ${isDragActive ? '#3B82F6' : file ? '#10B981' : 'rgba(59,130,246,0.3)'}`,
                        borderRadius: '16px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isDragActive
                            ? 'rgba(59,130,246,0.08)'
                            : file
                                ? 'rgba(16,185,129,0.05)'
                                : 'rgba(18,18,26,0.6)',
                        backdropFilter: 'blur(20px)',
                        transition: 'all 0.3s ease',
                        marginBottom: '1.5rem',
                    }}
                >
                    <input {...getInputProps()} />
                    <AnimatePresence mode="wait">
                        {file ? (
                            <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{getIcon(file)}</div>
                                <div style={{ fontWeight: 600, color: '#10B981', fontSize: '1rem', marginBottom: '0.25rem' }}>{file.name}</div>
                                <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{formatSize(file.size)}</div>
                                <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '0.5rem' }}>Click to change file</div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☁️</div>
                                <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                    {isDragActive ? 'Drop it here!' : 'Drag & drop your file'}
                                </div>
                                <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    or click to browse
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {['PDF', 'PNG/JPG', 'MP4/WebM'].map((t) => (
                                        <span key={t} className="tag-badge">{t}</span>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Title Input */}
                {file && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Material Title</label>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                                {progress < 100 ? 'Uploading & processing...' : '✓ Complete! Redirecting...'}
                            </span>
                            <span style={{ color: '#3B82F6', fontSize: '0.85rem', fontWeight: 600 }}>{progress}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(59,130,246,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
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
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#EF4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    className="btn-glow"
                    onClick={handleUpload}
                    disabled={!file || !title.trim() || uploading}
                    style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', opacity: (!file || !title.trim() || uploading) ? 0.5 : 1 }}
                >
                    {uploading ? 'Processing...' : 'Upload & Analyze with AI →'}
                </button>

                {/* Info blurb */}
                <div style={{ marginTop: '1.5rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <p style={{ color: '#60A5FA', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        ✦ <strong>After upload</strong>, our AI will extract text (OCR for images, Whisper for videos),
                        generate flashcards, exam points, and an interactive mind map — all automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}
