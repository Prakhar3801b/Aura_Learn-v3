'use client';

import { motion } from 'framer-motion';

interface Props {
  data: any;
  currentStep: number;
}

export default function ArrayRenderer({ data, currentStep }: Props) {
  const step = data.steps[currentStep];
  const animations = step?.animations || [];

  return (
    <div className="w-full h-[400px] flex items-center justify-center bg-bg/50 rounded-xl overflow-hidden">
      <div className="flex gap-2">
        {data.components.map((comp: any, index: number) => {
          const isTarget = animations.some((a: any) => a.target === comp.id);
          const relatedEntity = data.entities.find((e: any) => e.current_position === comp.id);
          
          return (
            <motion.div
              key={comp.id}
              animate={{
                scale: isTarget ? 1.05 : 1,
                borderColor: isTarget ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isTarget ? 'var(--pastel-sky)' : 'var(--surface)',
              }}
              className="w-16 h-16 border-2 flex flex-col items-center justify-center rounded-lg shadow-sm"
            >
              <div className="text-[10px] text-muted uppercase font-bold">{index}</div>
              <div className="text-sm font-bold">{comp.label}</div>
              {relatedEntity && (
                <motion.div
                    layoutId={relatedEntity.id}
                    className="absolute -top-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs"
                >
                    {relatedEntity.label.substring(0, 1)}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
