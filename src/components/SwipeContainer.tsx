import { type ReactNode, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { SWIPE_THRESHOLD } from '../lib/constants';

export interface SwipeContainerHandle {
  swipe: (direction: 'left' | 'right') => void;
}

interface SwipeContainerProps {
  children: ReactNode;
  enabled: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  cardKey: string;
}

export const SwipeContainer = forwardRef<SwipeContainerHandle, SwipeContainerProps>(
  function SwipeContainer({ children, enabled, onSwipeRight, onSwipeLeft, cardKey }, ref) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
    const correctOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.3]);
    const incorrectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.3, 0]);
    const [exiting, setExiting] = useState(false);

    const flyOff = useCallback(
      (direction: 'left' | 'right') => {
        if (exiting) return;
        setExiting(true);
        const target = direction === 'right' ? 400 : -400;
        animate(x, target, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          onComplete: () => {
            if (direction === 'right') onSwipeRight();
            else onSwipeLeft();
            x.set(0);
            setExiting(false);
          },
        });
      },
      [exiting, x, onSwipeRight, onSwipeLeft]
    );

    useImperativeHandle(ref, () => ({ swipe: flyOff }), [flyOff]);

    const handleDragEnd = useCallback(
      (_: unknown, info: PanInfo) => {
        if (!enabled || exiting) return;
        if (info.offset.x > SWIPE_THRESHOLD) {
          flyOff('right');
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          flyOff('left');
        }
      },
      [enabled, exiting, flyOff]
    );

    return (
      <div className="relative overflow-hidden">
        <motion.div
          key={cardKey}
          className="relative"
          style={{ x, rotate }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          drag={enabled && !exiting ? 'x' : false}
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
);
