import type { SessionStats } from '../lib/types';

interface StatsBarProps {
  stats: SessionStats;
  remaining: number;
  total: number;
}

export function StatsBar({ stats, remaining, total }: StatsBarProps) {
  const attempted = stats.correct + stats.incorrect;
  const accuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <div className="flex gap-4">
        <span className="text-emerald-600 dark:text-emerald-400">{stats.correct} correct</span>
        <span className="text-rose-600 dark:text-rose-400">{stats.incorrect} incorrect</span>
      </div>
      <div className="flex gap-4">
        {attempted > 0 && <span>{accuracy}%</span>}
        <span>{remaining}/{total} left</span>
      </div>
    </div>
  );
}
