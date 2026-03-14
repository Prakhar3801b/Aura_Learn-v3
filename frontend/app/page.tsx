'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GetStartedButton } from '@/components/AuraButton';

const phrases = [
  "engine behind better grades",
  "transform your notes into intelligence",
  "your AI study companion",
  "Learning Re-Engineered"
];

function TypewriterHeadline() {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    const handleType = () => {
      const currentFullText = phrases[index];

      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        if (displayText === currentFullText) {
          setTimeout(() => setIsDeleting(true), 2000);
          setSpeed(50);
        } else {
          setSpeed(100);
        }
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % phrases.length);
          setSpeed(100);
        } else {
          setSpeed(50);
        }
      }
    };

    const timer = setTimeout(handleType, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, index, speed]);

  return (
    <span style={{ color: '#7C3AED', display: 'inline-block', minHeight: '1.2em' }}>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        style={{ borderRight: '3px solid #7C3AED', marginLeft: '2px' }}
      />
    </span>
  );
}

const features = [
  {
    title: 'AI Mind Maps',
    description: 'Automatically generate interactive concept maps from any study material',
    category: 'AI Study',
    rating: '4.8',
    students: '9,530',
    href: '/dashboard',
    color: 'card-pastel-rose',
    icon: '🧠',
  },
  {
    title: 'Predictive Flashcards',
    description: 'Smart spaced-repetition flashcards powered by AI analysis',
    category: 'Smart Study',
    rating: '4.9',
    students: '7,245',
    href: '/dashboard',
    color: 'card-pastel-peach',
    icon: '⚡',
  },
  {
    title: 'Exam Point Extraction',
    description: 'AI identifies the most likely exam questions from your notes',
    category: 'Output Driven',
    rating: '4.9',
    students: '6,726',
    href: '/dashboard',
    color: 'card-pastel-mint',
    icon: '🎯',
  },
  {
    title: 'WebXR AR Labs',
    description: 'Interactive 3D science experiments right from your phone browser',
    category: 'AR / VR',
    rating: '5.0',
    students: '8,735',
    href: '/ar-labs',
    color: 'card-pastel-lavender',
    icon: '🥽',
    badge: 'Top 10',
  },
];

const categories = ['All', 'AI Study', 'Smart Study', 'AR / VR'];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '3rem 2.5rem' }}>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'max(1.8rem, 2.5vw)',
            fontWeight: 600,
            color: '#1A1A2E',
            marginBottom: '0.5rem',
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ color: '#7C3AED' }}>&gt;</span> Aura_Learn
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.2rem, 2.8vw, 1.8rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#1A1A2E',
              maxWidth: '1000px',
            }}
          >
            <TypewriterHeadline />
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Link href="/register">
            <GetStartedButton>Start Learning Free</GetStartedButton>
          </Link>
          <Link href="/ar-labs">
            <button
              style={{
                background: 'transparent',
                border: '1px solid #E8E2DA',
                borderRadius: '10px',
                color: '#1A1A2E',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.65rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Explore AR Labs
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ── Category Filters ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}
      >
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`category-pill ${i === 0 ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* ── Section: Most Popular ── */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontWeight: 500,
          fontSize: '0.85rem',
          color: '#7C7C8A',
          letterSpacing: '0.03em',
          marginBottom: '1.25rem',
        }}
      >
        Most popular
      </motion.h2>

      {/* ── Features Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <Link href={f.href} style={{ textDecoration: 'none' }}>
              <div className={`feature-card ${f.color}`}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="feature-category">
                    <span style={{ fontSize: '1rem' }}>{f.icon}</span>
                    {f.category}
                  </div>
                  <div className="feature-rating">
                    <span style={{ color: '#E07B5A' }}>★</span>
                    {f.rating}
                  </div>
                </div>

                {/* Title */}
                <h3>{f.title}</h3>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(26, 26, 46, 0.65)',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                }}>
                  {f.description}
                </p>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="feature-meta">{f.students} students</span>
                  {f.badge && (
                    <span style={{
                      background: 'rgba(255,255,255,0.5)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '99px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#7C3AED',
                    }}>
                      🏆 {f.badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Featured Course Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.78rem',
          color: '#7C7C8A',
          letterSpacing: '0.02em',
          marginBottom: '1rem',
        }}
      >
        Featured course
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55 }}
        className="card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '20px',
        }}
      >
        <h2 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#1A1A2E',
          marginBottom: '0.75rem',
        }}>
          Ready to Transform How You Study?
        </h2>
        <p style={{ color: '#7C7C8A', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
          Upload your first material and get AI-powered results in seconds.
        </p>
        <Link href="/register">
          <GetStartedButton>Create Free Account</GetStartedButton>
        </Link>
      </motion.div>
    </div>
  );
}
