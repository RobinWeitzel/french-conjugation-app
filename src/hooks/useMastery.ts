import { useState, useCallback, useRef } from 'react';
import { db } from '../lib/db';
import { BOX_INTERVALS, MAX_BOX } from '../lib/constants';
import type { Stat, SessionStats, Direction } from '../lib/types';

function getToday(): string {
  return new Date().toISOString().split('T')[0]!;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

export function useMastery(mode: 'conjugation' | 'listening' = 'conjugation', direction?: Direction) {
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });

  const lastActionRef = useRef<{
    statId: string;
    previousStat: Stat | null;
    activityId: number;
    wasCorrect: boolean;
  } | null>(null);

  const recordCorrect = useCallback(async (id: string): Promise<boolean> => {
    const previousStat = (await db.stats.get(id)) ?? null;
    const stat = previousStat ?? { id, correctCount: 0, box: 1, nextReview: getToday(), lastPracticed: '' };
    const today = getToday();
    const newBox = Math.min(stat.box + 1, MAX_BOX);
    const interval = BOX_INTERVALS[newBox] ?? 30;
    await db.stats.put({
      id,
      correctCount: stat.correctCount + 1,
      box: newBox,
      nextReview: addDays(today, interval),
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
    const activityId = await db.activity.add({ date: today, mode, correct: true, direction });
    lastActionRef.current = { statId: id, previousStat, activityId: activityId as number, wasCorrect: true };
    // "removed from session" when moved to box 2+ (has future review date)
    return interval > 0;
  }, [mode, direction]);

  const recordIncorrect = useCallback(async (id: string) => {
    const previousStat = (await db.stats.get(id)) ?? null;
    const stat = previousStat ?? { id, correctCount: 0, box: 1, nextReview: getToday(), lastPracticed: '' };
    const today = getToday();
    await db.stats.put({
      ...stat,
      correctCount: 0,
      box: 1,
      nextReview: today,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
    const activityId = await db.activity.add({ date: today, mode, correct: false, direction });
    lastActionRef.current = { statId: id, previousStat, activityId: activityId as number, wasCorrect: false };
  }, [mode, direction]);

  const undo = useCallback(async () => {
    const action = lastActionRef.current;
    if (!action) return null;

    if (action.previousStat) {
      await db.stats.put(action.previousStat);
    } else {
      await db.stats.delete(action.statId);
    }

    await db.activity.delete(action.activityId);

    setSessionStats((s) => ({
      correct: Math.max(0, s.correct - (action.wasCorrect ? 1 : 0)),
      incorrect: Math.max(0, s.incorrect - (action.wasCorrect ? 0 : 1)),
    }));

    lastActionRef.current = null;
    return action;
  }, []);

  const isDue = useCallback(async (id: string): Promise<boolean> => {
    const stat = await db.stats.get(id);
    if (!stat) return true; // new card
    return stat.nextReview <= getToday();
  }, []);

  const resetStats = useCallback(async (prefix?: string) => {
    if (prefix) {
      const stats = await db.stats.where('id').startsWith(prefix).toArray();
      await db.stats.bulkDelete(stats.map((s) => s.id));
    } else {
      await db.stats.clear();
    }
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  const resetSession = useCallback(() => {
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  return { sessionStats, recordCorrect, recordIncorrect, isDue, resetStats, resetSession, undo };
}
