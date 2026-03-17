'use client';

import { motion } from 'framer-motion';

interface Props {
  data: any;
  currentStep: number;
}

export default function GraphRenderer({ data, currentStep }: Props) {
  const step = data.steps[currentStep];
  const animations = step?.animations || [];

  return (
    <div className="relative w-full h-[400px] border border-dashed border-border rounded-xl overflow-hidden bg-bg/50">
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
              stroke="var(--primary)"
              strokeOpacity="0.2"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {data.components.map((comp: any) => {
        const isTarget = animations.some((a: any) => a.target === comp.id);
        return (
          <motion.div
            key={comp.id}
            animate={{
              scale: isTarget ? 1.2 : 1,
              boxShadow: isTarget ? '0 0 20px var(--primary)' : '0 2px 5px rgba(0,0,0,0.1)',
              borderColor: isTarget ? 'var(--primary)' : 'var(--border)',
            }}
            style={{
              left: comp.position.x,
              top: comp.position.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute w-12 h-12 bg-surface border-2 rounded-full flex items-center justify-center z-10"
          >
            <div className="text-[10px] font-bold text-center px-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {comp.label}
            </div>
          </motion.div>
        );
      })}

      {data.entities.map((ent: any) => {
        const anim = animations.find((a: any) => a.target === ent.id);
        const currentComp = data.components.find((c: any) => c.id === ent.current_position);
        let pos = currentComp?.position || { x: 0, y: 0 };
        
        return (
          <motion.div
            key={ent.id}
            animate={anim?.type === 'move' ? {
              x: data.components.find((c: any) => c.id === anim.to)?.position.x || pos.x,
              y: data.components.find((c: any) => c.id === anim.to)?.position.y || pos.y,
            } : {
              x: pos.x,
              y: pos.y,
            }}
            transition={{ duration: anim?.duration || 1 }}
            style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
            className="absolute w-6 h-6 bg-secondary border border-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold z-20"
          >
            {ent.label.substring(0, 1)}
          </motion.div>
        );
      })}
    </div>
  );
}
