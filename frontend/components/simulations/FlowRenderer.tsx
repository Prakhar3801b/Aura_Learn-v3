'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  data: any;
  currentStep: number;
}

export default function FlowRenderer({ data, currentStep }: Props) {
  const step = data.steps[currentStep];
  const animations = step?.animations || [];

  return (
    <div className="relative w-full h-[400px] border border-dashed border-border rounded-xl overflow-hidden bg-bg/50">
      {/* Connections (Lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {data.connections.map((conn: any, i: number) => {
          const from = data.components.find((c: any) => c.id === conn.from);
          const to = data.components.find((c: any) => c.id === conn.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.position.x}
              y1={from.position.y}
              x2={to.position.x}
              y2={to.position.y}
              stroke="var(--border)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>

      {/* Components (Static Nodes) */}
      {data.components.map((comp: any) => {
        const isTarget = animations.some((a: any) => a.target === comp.id);
        return (
          <motion.div
            key={comp.id}
            initial={false}
            animate={{
              boxShadow: isTarget ? '0 0 15px var(--primary)' : '0 2px 5px rgba(0,0,0,0.1)',
              borderColor: isTarget ? 'var(--primary)' : 'var(--border)',
              scale: isTarget ? 1.05 : 1,
            }}
            style={{
              left: comp.position.x,
              top: comp.position.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute p-4 bg-surface border-2 rounded-lg text-center min-w-[120px] z-10"
          >
            <div className="text-sm font-bold">{comp.label}</div>
          </motion.div>
        );
      })}

      {/* Entities (Dynamic Moving Parts) */}
      {data.entities.map((ent: any) => {
        const anim = animations.find((a: any) => a.target === ent.id);
        const currentComp = data.components.find((c: any) => c.id === ent.current_position);
        
        // Base position if no animation or if move animation exists
        let pos = currentComp?.position || { x: 0, y: 0 };
        
        return (
          <motion.div
            key={ent.id}
            initial={false}
            animate={anim?.type === 'move' ? {
              x: data.components.find((c: any) => c.id === anim.to)?.position.x || pos.x,
              y: data.components.find((c: any) => c.id === anim.to)?.position.y || pos.y,
            } : {
              x: pos.x,
              y: pos.y,
            }}
            transition={{ duration: anim?.duration || 1, ease: "easeInOut" }}
            style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
            }}
            className="absolute w-8 h-8 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg z-20"
          >
            {ent.label.substring(0, 1)}
            {anim?.style?.glow && (
              <div className="absolute inset-0 rounded-full animate-pulse bg-primary/40 scale-150 -z-10" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
