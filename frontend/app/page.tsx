'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const features = [
  {
    icon: '🧠',
    title: 'AI Mind Maps',
    desc: 'Interactive, clickable knowledge graphs auto-generated from any material. Video timestamps linked directly to nodes.',
    color: '#3B82F6',
  },
  {
    icon: '⚡',
    title: 'Predictive Flashcards',
    desc: 'Groq-powered Llama 3 generates exam-targeted Q&A with spaced-repetition confidence tracking.',
    color: '#7C3AED',
  },
  {
    icon: '🎯',
    title: 'Exam Point Extraction',
    desc: 'Strictly outcome-driven results — critical facts, formulas, and definitions ranked by exam importance.',
    color: '#06B6D4',
  },
  {
    icon: '🥽',
    title: 'WebXR AR Labs',
    desc: '7 interactive labs — Physics, Chemistry, Biology — projected directly onto your desk via mobile browser. No app needed.',
    color: '#10B981',
  },
  {
    icon: '🎧',
    title: 'Video Intelligence',
    desc: 'Whisper AI transcribes video lectures and links precise timestamps to mind map nodes.',
    color: '#F59E0B',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'Session monitoring with anomaly detection. The system adapts when your comprehension drops.',
    color: '#EF4444',
  },
];

const stats = [
  { label: 'AR Labs', value: '7' },
  { label: 'AI Models', value: '3' },
  { label: 'File Types', value: 'PDF · Image · Video' },
  { label: 'Focus Mode', value: '∞' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px' }}>

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '6rem 2rem 4rem',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '99px',
                color: '#60A5FA',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 1rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              ✦ Powered by Groq · Llama 3 · WebXR
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'Outfit',
              fontSize: 'clamp(2.4rem, 7vw, 5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              color: '#F1F5F9',
            }}
          >
            The Study Engine That{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #60A5FA, #7C3AED, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Guarantees Results
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              color: '#94A3B8',
              fontSize: '1.15rem',
              lineHeight: 1.7,
              maxWidth: '640px',
              margin: '0 auto 3rem',
            }}
          >
            Upload any PDF, handwritten note, or video lecture. Aura Learn generates
            targeted exam points, predictive flashcards, interactive mind maps, and
            WebXR AR labs — all backed by real-time AI analytics.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-glow" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              Start Learning Free →
            </Link>
            <Link href="/ar-labs" className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              Explore AR Labs
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '4rem',
            padding: '2rem',
            background: 'rgba(18,18,26,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(59,130,246,0.15)',
          }}
        >
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'Outfit',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #60A5FA, #7C3AED)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {s.value}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            fontFamily: 'Outfit',
            fontSize: '2rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#F1F5F9',
          }}
        >
          Everything Built for{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #60A5FA, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Academic Success
          </span>
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card"
              style={{ padding: '2rem' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${f.color}20`,
                  border: `1px solid ${f.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#F1F5F9',
                  marginBottom: '0.6rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ maxWidth: '800px', margin: '2rem auto 6rem', padding: '0 2rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(59,130,246,0.1)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Outfit',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#F1F5F9',
              marginBottom: '1rem',
            }}
          >
            Ready to Transform How You Study?
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: '2rem', fontSize: '1rem' }}>
            Upload your first material and get AI-powered results in seconds.
          </p>
          <Link href="/register" className="btn-glow" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
            Create Free Account →
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
