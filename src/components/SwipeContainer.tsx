import { type ReactNode, useCallback, useState, useRef, useImperativeHandle, forwardRef } from 'react';
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
    const correctOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.4]);
    const incorrectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.4, 0]);
    const [exiting, setExiting] = useState(false);
    const prevCardKeyRef = useRef(cardKey);

    // Reset position synchronously during render when card changes
    if (prevCardKeyRef.current !== cardKey) {
      prevCardKeyRef.current = cardKey;
      x.set(0);
      if (exiting) setExiting(false);
    }

    const flyOff = useCallback(
      (direction: 'left' | 'right') => {
        if (exiting) return;
        setExiting(true);
        const target = direction === 'right' ? 500 : -500;
        const hint = direction === 'right' ? SWIPE_THRESHOLD : -SWIPE_THRESHOLD;

        // If starting near center (keyboard), flash the color first
        const currentX = x.get();
        const needsHint = Math.abs(currentX) < SWIPE_THRESHOLD * 0.5;

        if (needsHint) {
          // Quick nudge to show color, then fly off
          animate(x, hint, {
            type: 'tween',
            duration: 0.1,
            onComplete: () => {
              animate(x, target, {
                type: 'tween',
                duration: 0.15,
                ease: 'easeIn',
                onComplete: () => {
                  if (direction === 'right') onSwipeRight();
                  else onSwipeLeft();
                },
              });
            },
          });
        } else {
          // Already dragged past threshold, just fly off fast
          animate(x, target, {
            type: 'tween',
            duration: 0.15,
            ease: 'easeIn',
            onComplete: () => {
              if (direction === 'right') onSwipeRight();
              else onSwipeLeft();
            },
          });
        }
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
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
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
