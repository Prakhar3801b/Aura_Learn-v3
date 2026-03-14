-- ─────────────────────────────────────────
-- Aura Learn V3 — Migration 007
-- Add graph_type to Mind Map tables
-- ─────────────────────────────────────────

-- 1. Add graph_type to mind_map_nodes
ALTER TABLE mind_map_nodes 
ADD COLUMN IF NOT EXISTS graph_type TEXT DEFAULT 'mindmap';

-- 2. Add graph_type to mind_map_edges
ALTER TABLE mind_map_edges 
ADD COLUMN IF NOT EXISTS graph_type TEXT DEFAULT 'mindmap';

-- 3. Update existing records to ensure they have a type
UPDATE mind_map_nodes SET graph_type = 'mindmap' WHERE graph_type IS NULL;
UPDATE mind_map_edges SET graph_type = 'mindmap' WHERE graph_type IS NULL;

-- 4. Fix node_type check constraint (allow 'relation' for Concept Graphs)
ALTER TABLE mind_map_nodes DROP CONSTRAINT IF EXISTS mind_map_nodes_node_type_check;
ALTER TABLE mind_map_nodes 
ADD CONSTRAINT mind_map_nodes_node_type_check 
CHECK (node_type IN ('root', 'concept', 'detail', 'relation'));

-- 5. (Optional) Add index for faster filtering by graph_type
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_graph_type ON mind_map_nodes(graph_type);
CREATE INDEX IF NOT EXISTS idx_mind_map_edges_graph_type ON mind_map_edges(graph_type);
