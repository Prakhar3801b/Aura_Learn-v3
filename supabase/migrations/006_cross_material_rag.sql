-- Function for similarity search across MULTIPLE materials
CREATE OR REPLACE FUNCTION search_multi_material_chunks(
  query_embedding vector(1024), -- Note: Use the dimension from the table (1024)
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
