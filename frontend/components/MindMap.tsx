'use client';

import { useCallback, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
    Edge,
    ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface MindMapProps {
    nodes: any[];
    edges: any[];
    onNodeClick?: (node: any) => void;
}

function nodeTypeColor(type: string): string {
    if (type === 'root') return '#7C3AED';
    if (type === 'concept') return '#3B82F6';
    return '#06B6D4';
}

function buildFlowNodes(rawNodes: any[]): Node[] {
    return rawNodes.map((n, i) => ({
        id: n.id,
        data: {
            label: (
                <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#F1F5F9', marginBottom: '2px' }}>
                        {n.label}
                    </div>
                    {n.video_timestamp_label && (
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: '#F59E0B',
                                background: 'rgba(245,158,11,0.15)',
                                borderRadius: '10px',
                                padding: '1px 6px',
                                display: 'inline-block',
                            }}
                        >
                            ⏱ {n.video_timestamp_label}
                        </div>
                    )}
                </div>
            ),
        },
        position: {
            x: 200 + Math.cos((i / rawNodes.length) * 2 * Math.PI) * 280,
            y: 200 + Math.sin((i / rawNodes.length) * 2 * Math.PI) * 180,
        },
        style: {
            background: 'rgba(18,18,26,0.95)',
            border: `2px solid ${n.color || nodeTypeColor(n.node_type)}`,
            borderRadius: '12px',
            color: '#F1F5F9',
            minWidth: '120px',
            boxShadow: `0 0 20px ${n.color || nodeTypeColor(n.node_type)}30`,
        },
        type: 'default',
    }));
}

function buildFlowEdges(rawEdges: any[]): Edge[] {
    return rawEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        style: { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2 },
        labelStyle: { fill: '#94A3B8', fontSize: 10 },
    }));
}

export default function MindMap({ nodes: rawNodes, edges: rawEdges, onNodeClick }: MindMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(buildFlowNodes(rawNodes));
    const [edges, setEdges, onEdgesChange] = useEdgesState(buildFlowEdges(rawEdges));

    useEffect(() => {
        if (rawNodes && rawNodes.length > 0) {
            setNodes(buildFlowNodes(rawNodes));
            setEdges(buildFlowEdges(rawEdges));
        }
    }, [rawNodes, rawEdges, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const raw = rawNodes.find((n) => n.id === node.id);
            if (raw) onNodeClick?.(raw);
        },
        [rawNodes, onNodeClick]
    );

    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                connectionMode={ConnectionMode.Loose}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls style={{ background: 'rgba(18,18,26,0.9)', border: '1px solid rgba(59,130,246,0.2)' }} />
                <MiniMap
                    style={{ background: 'rgba(18,18,26,0.9)', border: '1px solid rgba(59,130,246,0.2)' }}
                    nodeColor={(n) => {
                        const raw = rawNodes.find((r) => r.id === n.id);
                        return raw?.color || '#3B82F6';
                    }}
                />
                <Background color="rgba(59,130,246,0.05)" gap={20} />
            </ReactFlow>
        </div>
    );
}
