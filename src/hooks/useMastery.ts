import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { BOX_INTERVALS, MAX_BOX } from '../lib/constants';
import type { Stat, SessionStats } from '../lib/types';

function getToday(): string {
  return new Date().toISOString().split('T')[0]!;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

export function useMastery(mode: 'conjugation' | 'listening' = 'conjugation') {
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });

  const getStat = useCallback(async (id: string): Promise<Stat> => {
    const stat = await db.stats.get(id);
    return stat ?? { id, correctCount: 0, box: 1, nextReview: getToday(), lastPracticed: '' };
  }, []);

  const recordCorrect = useCallback(async (id: string): Promise<boolean> => {
    const stat = await getStat(id);
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
    await db.activity.add({ date: today, mode, correct: true });
    // "removed from session" when moved to box 2+ (has future review date)
    return interval > 0;
  }, [getStat, mode]);

  const recordIncorrect = useCallback(async (id: string) => {
    const stat = await getStat(id);
    const today = getToday();
    await db.stats.put({
      ...stat,
      correctCount: 0,
      box: 1,
      nextReview: today,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
    await db.activity.add({ date: getToday(), mode, correct: false });
  }, [getStat, mode]);

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

  return { sessionStats, recordCorrect, recordIncorrect, isDue, resetStats, resetSession };
}
