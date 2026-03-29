import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { TENSES } from '../lib/constants';
import type { TenseKey } from '../lib/types';

interface BoxDistribution {
  [box: number]: number;
}

interface GroupStats {
  total: number;
  mastered: number;
  boxes: BoxDistribution;
}

interface DailyActivity {
  date: string;
  conjugation: number;
  listening: number;
}

export interface StatisticsData {
  totalCards: number;
  mastered: number;
  masteredPercent: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  tenses: Record<string, GroupStats>;
  listeningCategories: Record<string, GroupStats>;
  listeningOverall: GroupStats;
  dailyActivity: DailyActivity[];
}

function emptyGroupStats(): GroupStats {
  return { total: 0, mastered: 0, boxes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

export function useStatistics(): StatisticsData | undefined {
  return useLiveQuery(async () => {
    const [allStats, allActivity, allSentences] = await Promise.all([
      db.stats.toArray(),
      db.activity.toArray(),
      db.sentences.toArray(),
    ]);

    // Build sentence category lookup
    const sentenceCategoryMap = new Map<string, string>();
    for (const s of allSentences) {
      sentenceCategoryMap.set(s.id, s.category);
    }

    // Separate conjugation vs listening stats
    const conjugationStats = allStats.filter((s) => !s.id.startsWith('listening_'));
    const listeningStats = allStats.filter((s) => s.id.startsWith('listening_'));

    // Overall
    const totalCards = allStats.length;
    const mastered = allStats.filter((s) => s.box >= 5).length;
    const masteredPercent = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

    // Accuracy from activity log
    const totalAnswers = allActivity.length;
    const correctAnswers = allActivity.filter((a) => a.correct).length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Per-tense breakdown
    const tenseKeys = Object.keys(TENSES) as TenseKey[];
    const tenses: Record<string, GroupStats> = {};

    for (const stat of conjugationStats) {
      let matchedTense: string | null = null;
      const sortedKeys = [...tenseKeys].sort((a, b) => b.length - a.length);
      for (const tk of sortedKeys) {
        if (stat.id.includes(`_${tk}_`)) {
          matchedTense = tk;
          break;
        }
      }
      if (!matchedTense) continue;

      if (!tenses[matchedTense]) tenses[matchedTense] = emptyGroupStats();
      const group = tenses[matchedTense]!;
      group.total++;
      if (stat.box >= 5) group.mastered++;
      group.boxes[stat.box] = (group.boxes[stat.box] ?? 0) + 1;
    }

    // Listening breakdown by category
    const listeningCategories: Record<string, GroupStats> = {};
    const listeningOverall = emptyGroupStats();

    for (const stat of listeningStats) {
      const sentenceId = stat.id.replace('listening_', '');
      const category = sentenceCategoryMap.get(sentenceId) ?? 'Unknown';

      if (!listeningCategories[category]) listeningCategories[category] = emptyGroupStats();
      const group = listeningCategories[category];
      group.total++;
      if (stat.box >= 5) group.mastered++;
      group.boxes[stat.box] = (group.boxes[stat.box] ?? 0) + 1;

      listeningOverall.total++;
      if (stat.box >= 5) listeningOverall.mastered++;
      listeningOverall.boxes[stat.box] = (listeningOverall.boxes[stat.box] ?? 0) + 1;
    }

    // Daily activity (last 14 days)
    const today = new Date();
    const days: DailyActivity[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      days.push({ date: dateStr, conjugation: 0, listening: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));

    for (const a of allActivity) {
      const day = dayMap.get(a.date);
      if (!day) continue;
      if (a.mode === 'conjugation') day.conjugation++;
      else day.listening++;
    }

    return {
      totalCards,
      mastered,
      masteredPercent,
      totalAnswers,
      correctAnswers,
      accuracy,
      tenses,
      listeningCategories,
      listeningOverall,
      dailyActivity: days,
    };
  });
}
