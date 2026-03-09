'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AuraButton, GetStartedButton } from '@/components/AuraButton';

const features = [
  {
    title: 'AI Mind Maps',
    short: 'VISUALIZE KNOWLEDGE',
    href: '/dashboard',
    color: '#3B82F6',
  },
  {
    title: 'Predictive Flashcards',
    short: 'SMART STUDY',
    href: '/dashboard',
    color: '#7C3AED',
  },
  {
    title: 'Exam Point Extraction',
    short: 'OUTPUT DRIVEN',
    href: '/dashboard',
    color: '#06B6D4',
  },
  {
    title: 'WebXR AR Labs',
    short: 'AR LEARNING',
    href: '/ar-labs',
    color: '#10B981',
  },
  {
    title: 'Video Intelligence',
    short: 'SMART TRANSCRIPTION',
    href: '/upload',
    color: '#F59E0B',
  },
  {
    title: 'Real-Time Analytics',
    short: 'GROWTH TRACKING',
    href: '/dashboard',
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
              ✦ Powered by Groq · Llama 3.3 · WebXR
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'Outfit',
              fontSize: 'clamp(2.4rem, 7vw, 5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '3rem',
              color: '#F1F5F9',
            }}
          >
            The Engine Behind{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #60A5FA, #7C3AED, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Better Grades
            </span>
          </h1>


          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register">
              <GetStartedButton>Start Learning Free</GetStartedButton>
            </Link>
            <Link href="/ar-labs">
              <AuraButton>Explore AR Labs</AuraButton>
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
            >
              <Link href={f.href || '#'}>
                <button className="feature-btn-container">
                  <span className="btn-text-one">{f.title.toUpperCase()}</span>
                  <span className="btn-text-two">{f.short}</span>
                </button>
              </Link>
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
          <Link href="/register">
            <GetStartedButton>Create Free Account</GetStartedButton>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
