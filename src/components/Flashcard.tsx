import { useState, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FlashcardProps {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ front, back, flipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="h-72 w-full cursor-pointer select-none sm:h-80"
      style={{ perspective: '1000px' }}
      onClick={onFlip}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Front */}
        <div
          className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

export function useFlipState() {
  const [flipped, setFlipped] = useState(false);
  const flip = useCallback(() => setFlipped((f) => !f), []);
  const reset = useCallback(() => setFlipped(false), []);
  return { flipped, flip, reset };
}
