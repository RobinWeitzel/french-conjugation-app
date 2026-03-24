import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { MASTERY_THRESHOLD } from '../lib/constants';
import type { Stat, SessionStats } from '../lib/types';

export function useMastery() {
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });

  const getStat = useCallback(async (id: string): Promise<Stat> => {
    const stat = await db.stats.get(id);
    return stat ?? { id, correctCount: 0, mastered: false, lastPracticed: '' };
  }, []);

  const recordCorrect = useCallback(async (id: string) => {
    const stat = await getStat(id);
    const newCount = stat.correctCount + 1;
    const mastered = newCount >= MASTERY_THRESHOLD;
    await db.stats.put({
      id,
      correctCount: newCount,
      mastered,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
    return mastered;
  }, [getStat]);

  const recordIncorrect = useCallback(async (id: string) => {
    await db.stats.put({
      id,
      correctCount: 0,
      mastered: false,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
  }, []);

  const isMastered = useCallback(async (id: string): Promise<boolean> => {
    const stat = await db.stats.get(id);
    return stat?.mastered ?? false;
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

  return { sessionStats, recordCorrect, recordIncorrect, isMastered, resetStats, resetSession };
}
