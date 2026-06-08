-- ══════════════════════════════════════════════════════════════════════
-- Aura Learn V3 — Update Vector Dimension
--
-- This migration updates the pgvector embedding dimensions from 1024
-- (Voyage AI) to 384 (sentence-transformers/all-MiniLM-L6-v2) for free,
-- local embeddings.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Remove incompatible data
-- We must truncate material_chunks because 1024-dim vectors cannot be
-- cast to 384-dim vectors. All existing chunks are invalidated.
TRUNCATE TABLE material_chunks;

-- 2. Drop existing indexes and search functions
DROP INDEX IF EXISTS material_chunks_embedding_idx;
DROP FUNCTION IF EXISTS search_material_chunks;
DROP FUNCTION IF EXISTS search_multi_material_chunks;

-- 3. Alter the embedding column dimension
ALTER TABLE material_chunks
ALTER COLUMN embedding TYPE vector(384);

-- 4. Recreate the index
CREATE INDEX material_chunks_embedding_idx
  ON material_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5. Recreate search_material_chunks function
CREATE OR REPLACE FUNCTION search_material_chunks(
  query_embedding vector(384),
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

-- 6. Recreate search_multi_material_chunks function
CREATE OR REPLACE FUNCTION search_multi_material_chunks(
  query_embedding vector(384),
  match_material_ids UUID[],
  match_count INT DEFAULT 10
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
  WHERE mc.material_id = ANY(match_material_ids)
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
