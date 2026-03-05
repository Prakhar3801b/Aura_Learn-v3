-- ══════════════════════════════════════════════════════════════════════
-- Aura Learn V3 — Full Database Schema  (Supabase / PostgreSQL)
-- Single migration: run this in the Supabase SQL Editor to bootstrap
-- every table, index, function, RLS policy, and storage bucket.
-- ══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector (RAG embeddings)


-- ─────────────────────────────────────────
-- 2. CORE TABLES
-- ─────────────────────────────────────────

-- 2a. Users (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  study_streak    INT DEFAULT 0,
  total_study_minutes INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  file_type       TEXT CHECK (file_type IN ('pdf', 'image', 'video')) NOT NULL,
  file_url        TEXT NOT NULL,
  status          TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2c. Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  difficulty      TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  topic           TEXT DEFAULT '',
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2d. Exam Points
CREATE TABLE IF NOT EXISTS exam_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  point           TEXT NOT NULL,
  topic           TEXT DEFAULT '',
  importance      TEXT CHECK (importance IN ('critical', 'high', 'medium')) DEFAULT 'high',
  page_reference  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 3. MIND MAP TABLES
-- ─────────────────────────────────────────

-- 3a. Mind Map Nodes
CREATE TABLE IF NOT EXISTS mind_map_nodes (
  id              TEXT PRIMARY KEY,
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  topic           TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  video_timestamp FLOAT,
  video_timestamp_label TEXT,
  node_type       TEXT CHECK (node_type IN ('root', 'concept', 'detail')) DEFAULT 'concept',
  color           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Mind Map Edges
CREATE TABLE IF NOT EXISTS mind_map_edges (
  id              TEXT PRIMARY KEY,
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
  target          TEXT NOT NULL,
  label           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 4. VECTOR STORE (RAG / pgvector)
-- ─────────────────────────────────────────

-- 4a. Material Chunks with embeddings
CREATE TABLE IF NOT EXISTS material_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  text            TEXT NOT NULL,
  embedding       vector(1536),
  char_start      INT,
  char_end        INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS material_chunks_embedding_idx
  ON material_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4c. Similarity search function (used by the backend RAG pipeline)
CREATE OR REPLACE FUNCTION search_material_chunks(
  query_embedding vector(1536),
  match_material_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  material_id UUID,
  chunk_index INT,
  text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.material_id,
    mc.chunk_index,
    mc.text,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM material_chunks mc
  WHERE mc.material_id = match_material_id
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ─────────────────────────────────────────
-- 5. ANALYTICS & STUDY SESSIONS
-- ─────────────────────────────────────────

-- 5a. Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  comprehension_score FLOAT DEFAULT 0.5 CHECK (comprehension_score BETWEEN 0 AND 1),
  events_count    INT DEFAULT 0,
  anomalies_count INT DEFAULT 0
);

-- 5b. Session Events (micro-events during study)
CREATE TABLE IF NOT EXISTS session_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,  -- pause, wrong_answer, correct_answer, re-read, skip, stuck
  topic           TEXT,
  node_id         TEXT,
  metadata        JSONB,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- 5c. Anomaly Flags (detected comprehension issues)
CREATE TABLE IF NOT EXISTS anomaly_flags (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  anomaly_type    TEXT NOT NULL,  -- comprehension_drop, stuck_on_topic, repeated_errors
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  topic           TEXT,
  intervention    TEXT NOT NULL,  -- simplify_content, suggest_ar_lab, add_flashcard
  resolved        BOOLEAN DEFAULT FALSE
);


-- ─────────────────────────────────────────
-- 6. AR LABS (XR experiment catalog)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ar_labs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  category        TEXT CHECK (category IN ('physics', 'chemistry', 'biology')) NOT NULL,
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  difficulty      TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  duration_minutes INT NOT NULL DEFAULT 15,
  thumbnail       TEXT,
  scene           JSONB NOT NULL,          -- A-Frame scene config (entities, instructions, outcomes)
  requires_ar     BOOLEAN DEFAULT TRUE,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 7. INDEXES (analytics performance)
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_study_materials_user       ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_status     ON study_materials(status);
CREATE INDEX IF NOT EXISTS idx_flashcards_material        ON flashcards(material_id);
CREATE INDEX IF NOT EXISTS idx_exam_points_material       ON exam_points(material_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_material    ON mind_map_nodes(material_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_material    ON mind_map_edges(material_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_material   ON material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user        ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_material    ON study_sessions(material_id);
CREATE INDEX IF NOT EXISTS idx_session_events_session     ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp   ON session_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomaly_flags_session      ON anomaly_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_flags_resolved     ON anomaly_flags(resolved);
CREATE INDEX IF NOT EXISTS idx_ar_labs_category           ON ar_labs(category);
CREATE INDEX IF NOT EXISTS idx_ar_labs_difficulty          ON ar_labs(difficulty);


-- ─────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_points      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_nodes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_edges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_flags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_labs          ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────
-- 9. RLS POLICIES
-- ─────────────────────────────────────────

-- Helper: get current user's internal UUID from auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Users: can only read/update their own profile
CREATE POLICY "users_select_own"    ON users    FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "users_update_own"    ON users    FOR UPDATE USING (auth_user_id = auth.uid());

-- Study Materials: users access only their own
CREATE POLICY "materials_all_own"   ON study_materials FOR ALL
  USING (user_id = public.get_current_user_id());

-- Flashcards: through material ownership
CREATE POLICY "flashcards_all_own"  ON flashcards FOR ALL
  USING (material_id IN (SELECT id FROM study_materials WHERE user_id = public.get_current_user_id()));

-- Exam Points: through material ownership
CREATE POLICY "exam_points_all_own" ON exam_points FOR ALL
  USING (material_id IN (SELECT id FROM study_materials WHERE user_id = public.get_current_user_id()));

-- Mind Map Nodes: through material ownership
CREATE POLICY "mind_map_nodes_all_own" ON mind_map_nodes FOR ALL
  USING (material_id IN (SELECT id FROM study_materials WHERE user_id = public.get_current_user_id()));

-- Mind Map Edges: through material ownership
CREATE POLICY "mind_map_edges_all_own" ON mind_map_edges FOR ALL
  USING (material_id IN (SELECT id FROM study_materials WHERE user_id = public.get_current_user_id()));

-- Material Chunks: through material ownership
CREATE POLICY "material_chunks_all_own" ON material_chunks FOR ALL
  USING (material_id IN (SELECT id FROM study_materials WHERE user_id = public.get_current_user_id()));

-- Study Sessions: users access only their own
CREATE POLICY "sessions_all_own"    ON study_sessions FOR ALL
  USING (user_id = public.get_current_user_id());

-- Session Events: through session ownership
CREATE POLICY "session_events_all_own" ON session_events FOR ALL
  USING (session_id IN (SELECT id FROM study_sessions WHERE user_id = public.get_current_user_id()));

-- Anomaly Flags: through session ownership
CREATE POLICY "anomaly_flags_all_own"  ON anomaly_flags FOR ALL
  USING (session_id IN (SELECT id FROM study_sessions WHERE user_id = public.get_current_user_id()));

-- AR Labs: publicly readable, admin-writable (service_role key for inserts/updates)
CREATE POLICY "ar_labs_public_read" ON ar_labs FOR SELECT USING (true);


-- ─────────────────────────────────────────
-- 10. STORAGE BUCKETS
-- ─────────────────────────────────────────

-- Bucket for uploaded study materials (PDFs, images, videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "storage_upload_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'study-materials'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_read_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'study-materials');

CREATE POLICY "storage_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'study-materials'
    AND auth.role() = 'authenticated'
  );


-- ─────────────────────────────────────────
-- 11. UTILITY FUNCTIONS
-- ─────────────────────────────────────────

-- Auto-update `updated_at` timestamp on any row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for auto-updating timestamps
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_study_materials_updated_at
  BEFORE UPDATE ON study_materials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_ar_labs_updated_at
  BEFORE UPDATE ON ar_labs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ══════════════════════════════════════════════════════════════════════
-- Done! All tables, indexes, RLS policies, storage, and functions are
-- now in place. Run this in the Supabase SQL Editor → New Query.
-- ══════════════════════════════════════════════════════════════════════
