-- ═══════════════════════════════════════════
-- Aura Learn V3 — Vector Store
-- Migration 002: pgvector for RAG
-- ═══════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- Material chunks with embeddings for similarity search
CREATE TABLE IF NOT EXISTS material_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536),
  char_start INT,
  char_end INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS material_chunks_embedding_idx
  ON material_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function for similarity search
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
