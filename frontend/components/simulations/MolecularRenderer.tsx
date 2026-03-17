'use client';

import { motion } from 'framer-motion';

interface Props {
  data: any;
  currentStep: number;
}

export default function MolecularRenderer({ data, currentStep }: Props) {
  const step = data.steps[currentStep];
  const animations = step?.animations || [];

  return (
    <div className="relative w-full h-[400px] border border-dashed border-border rounded-xl overflow-hidden bg-bg/50">
      {/* Particles / Molecules */}
      {data.components.map((comp: any) => {
        const isTarget = animations.some((a: any) => a.target === comp.id);
        return (
          <motion.div
            key={comp.id}
            animate={{
              scale: isTarget ? [1, 1.2, 1] : 1,
              x: [0, Math.random() * 5 - 2.5, 0], // Slight Brownian motion
              y: [0, Math.random() * 5 - 2.5, 0],
            }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2 }}
            style={{
              left: comp.position.x,
              top: comp.position.y,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary/50 blur-[1px] shadow-lg flex items-center justify-center z-10 opacity-80"
          >
            <div className="text-[10px] font-bold text-white">{comp.label}</div>
          </motion.div>
        );
      })}

      {/* Interacting Particles */}
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
            className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_8px_white] z-20"
          />
        );
      })}
    </div>
  );
}
