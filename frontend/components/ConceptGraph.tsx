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
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ConceptGraphProps {
    nodes: any[];
    edges: any[];
    onNodeClick?: (node: any) => void;
}

function buildFlowNodes(rawNodes: any[]): Node[] {
    return rawNodes.map((n, i) => {
        const isRelation = n.node_type === 'relation';

        return {
            id: n.id,
            data: {
                label: (
                    <div style={{ textAlign: 'center', padding: isRelation ? '2px 4px' : '6px 10px' }}>
                        <div style={{
                            fontWeight: isRelation ? 600 : 700,
                            fontSize: isRelation ? '0.65rem' : '0.85rem',
                            color: isRelation ? '#F59E0B' : 'var(--text)',
                            textTransform: isRelation ? 'uppercase' : 'none'
                        }}>
                            {n.label}
                        </div>
                    </div>
                ),
            },
            position: {
                x: 300 + Math.cos((i / rawNodes.length) * 2 * Math.PI) * 350,
                y: 300 + Math.sin((i / rawNodes.length) * 2 * Math.PI) * 250,
            },
            style: {
                background: 'var(--surface)',
                border: `2px solid ${isRelation ? '#F59E0B' : '#7C3AED'}`,
                borderRadius: isRelation ? '50px' : '8px',
                color: 'var(--text)',
                minWidth: isRelation ? '80px' : '140px',
                boxShadow: isRelation ? '0 1px 4px rgba(0,0,0,0.04)' : '0 3px 10px rgba(0,0,0,0.08)',
                padding: '0',
            },
            type: 'default',
        };
    });
}

function buildFlowEdges(rawEdges: any[]): Edge[] {
    return rawEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: 'var(--border)', strokeWidth: 1.5 },
        labelStyle: { fill: 'var(--muted)', fontSize: 9, fontWeight: 500 },
        labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.8 },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--border)',
        },
    }));
}

export default function ConceptGraph({ nodes: rawNodes, edges: rawEdges, onNodeClick }: ConceptGraphProps) {
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
        <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg)' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 5, display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--surface)', border: '2px solid #7C3AED', borderRadius: '2px' }}></div>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>Concept</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--surface)', border: '2px solid #F59E0B', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>Relation</span>
                </div>
            </div>

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
                <Controls style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                <MiniMap
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    nodeColor={(n) => {
                        const raw = rawNodes.find((r) => r.id === n.id);
                        return raw?.node_type === 'relation' ? '#F59E0B' : '#7C3AED';
                    }}
                />
                <Background color="var(--border)" gap={25} size={1} />
            </ReactFlow>
        </div>
    );
}
