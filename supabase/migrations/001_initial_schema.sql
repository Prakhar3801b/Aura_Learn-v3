-- ═══════════════════════════════════════════
-- Aura Learn V3 — Initial Schema
-- Migration 001: Core tables
-- ═══════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (references Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  study_streak INT DEFAULT 0,
  total_study_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'video')) NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  topic TEXT DEFAULT '',
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Points
CREATE TABLE IF NOT EXISTS exam_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  point TEXT NOT NULL,
  topic TEXT DEFAULT '',
  importance TEXT CHECK (importance IN ('critical', 'high', 'medium')) DEFAULT 'high',
  page_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Map Nodes
CREATE TABLE IF NOT EXISTS mind_map_nodes (
  id TEXT PRIMARY KEY,
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  topic TEXT DEFAULT '',
  description TEXT DEFAULT '',
  video_timestamp FLOAT,
  video_timestamp_label TEXT,
  node_type TEXT CHECK (node_type IN ('root', 'concept', 'detail')) DEFAULT 'concept',
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Map Edges
CREATE TABLE IF NOT EXISTS mind_map_edges (
  id TEXT PRIMARY KEY,
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  comprehension_score FLOAT DEFAULT 1.0 CHECK (comprehension_score BETWEEN 0 AND 1),
  events_count INT DEFAULT 0,
  anomalies_count INT DEFAULT 0
);

-- Row Level Security
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (users see only their own data)
CREATE POLICY "users_own_materials" ON study_materials FOR ALL USING (user_id::text = auth.uid()::text);
CREATE POLICY "users_own_sessions" ON study_sessions FOR ALL USING (user_id::text = auth.uid()::text);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true) ON CONFLICT DO NOTHING;
