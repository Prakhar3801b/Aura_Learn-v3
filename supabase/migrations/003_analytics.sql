-- ═══════════════════════════════════════════
-- Aura Learn V3 — Analytics Tables
-- Migration 003: Session events & anomalies
-- ═══════════════════════════════════════════

-- Session Events (micro-events during study)
CREATE TABLE IF NOT EXISTS session_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- pause, wrong_answer, correct_answer, re-read, skip, stuck
  topic TEXT,
  node_id TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly Flags (detected comprehension issues)
CREATE TABLE IF NOT EXISTS anomaly_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,  -- comprehension_drop, stuck_on_topic, repeated_errors
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  topic TEXT,
  intervention TEXT NOT NULL,  -- simplify_content, suggest_ar_lab, add_flashcard
  resolved BOOLEAN DEFAULT FALSE
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS session_events_session_id_idx ON session_events(session_id);
CREATE INDEX IF NOT EXISTS session_events_timestamp_idx ON session_events(timestamp);
CREATE INDEX IF NOT EXISTS anomaly_flags_session_id_idx ON anomaly_flags(session_id);
CREATE INDEX IF NOT EXISTS anomaly_flags_resolved_idx ON anomaly_flags(resolved);

-- RLS
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_flags ENABLE ROW LEVEL SECURITY;
