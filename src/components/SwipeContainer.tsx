import { type ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { SWIPE_THRESHOLD } from '../lib/constants';

interface SwipeContainerProps {
  children: ReactNode;
  enabled: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function SwipeContainer({ children, enabled, onSwipeRight, onSwipeLeft }: SwipeContainerProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const correctOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.3]);
  const incorrectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.3, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!enabled) return;
      if (info.offset.x > SWIPE_THRESHOLD) {
        onSwipeRight();
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onSwipeLeft();
      }
    },
    [enabled, onSwipeRight, onSwipeLeft]
  );

  return (
    <div className="relative">
      <motion.div
        className="relative"
        style={{ x, rotate }}
        drag={enabled ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98 }}
      >
        {/* Correct overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500"
          style={{ opacity: correctOpacity }}
        />
        {/* Incorrect overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-rose-500"
          style={{ opacity: incorrectOpacity }}
        />
        {children}
      </motion.div>
    </div>
  );
}
