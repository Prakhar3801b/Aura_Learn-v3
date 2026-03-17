'use client';

import { motion } from 'framer-motion';

interface Props {
  data: any;
  currentStep: number;
}

export default function SystemRenderer({ data, currentStep }: Props) {
  const step = data.steps[currentStep];
  const animations = step?.animations || [];

  return (
    <div className="relative w-full h-[400px] border border-dashed border-border rounded-xl overflow-hidden bg-bg/50 flex items-center justify-center">
      {/* High-level modules */}
      {data.components.map((comp: any) => {
        const isTarget = animations.some((a: any) => a.target === comp.id);
        return (
          <motion.div
            key={comp.id}
            animate={{
              borderColor: isTarget ? 'var(--primary)' : 'var(--border)',
              backgroundColor: isTarget ? 'rgba(124, 58, 237, 0.05)' : 'var(--surface)',
              scale: isTarget ? 1.05 : 1,
            }}
            style={{
              left: comp.position.x,
              top: comp.position.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute p-6 border-2 rounded-2xl shadow-premium min-w-[150px] min-h-[100px] flex flex-col items-center justify-center z-10"
          >
            <div className="text-sm font-bold text-primary mb-1">{comp.label}</div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Module</div>
          </motion.div>
        );
      })}

      {/* Dynamic Signals */}
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
              opacity: [1, 0.5, 1],
            } : {
              x: pos.x,
              y: pos.y,
            }}
            transition={{ duration: anim?.duration || 1.5, repeat: anim?.type === 'move' ? Infinity : 0 }}
            style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
            className="absolute w-4 h-4 bg-primary rounded-sm shadow-[0_0_10px_var(--primary)] z-20"
          />
        );
      })}
    </div>
  );
}
