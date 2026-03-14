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
    if (type === 'root') return '#6B21A8';
    if (type === 'concept') return '#1A1A2E';
    return '#E07B5A';
}

function buildFlowNodes(rawNodes: any[]): Node[] {
    return rawNodes.map((n, i) => ({
        id: n.id,
        data: {
            label: (
                <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1A1A2E', marginBottom: '2px' }}>
                        {n.label}
                    </div>
                    {n.video_timestamp_label && (
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: '#8B6914',
                                background: '#FFF5D6',
                                borderRadius: '10px',
                                padding: '1px 6px',
                                display: 'inline-block',
                                fontFamily: "'JetBrains Mono', monospace",
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
            background: '#FFFFFF',
            border: `2px solid ${n.color || nodeTypeColor(n.node_type)}`,
            borderRadius: '12px',
            color: '#1A1A2E',
            minWidth: '120px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
        style: { stroke: '#E8E2DA', strokeWidth: 2 },
        labelStyle: { fill: '#7C7C8A', fontSize: 10 },
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
                <Controls style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: '8px' }} />
                <MiniMap
                    style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: '8px' }}
                    nodeColor={(n) => {
                        const raw = rawNodes.find((r) => r.id === n.id);
                        return raw?.color || '#1A1A2E';
                    }}
                />
                <Background color="rgba(26,26,46,0.04)" gap={20} />
            </ReactFlow>
        </div>
    );
}
