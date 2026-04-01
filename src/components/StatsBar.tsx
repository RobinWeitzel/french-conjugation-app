import type { SessionStats } from '../lib/types';

interface StatsBarProps {
  stats: SessionStats;
  remaining: number;
  total: number;
  onUndo?: () => void;
}

export function StatsBar({ stats, remaining, total, onUndo }: StatsBarProps) {
  const attempted = stats.correct + stats.incorrect;
  const accuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-4">
        <span className="text-emerald-600 dark:text-emerald-400">{stats.correct} correct</span>
        <span className="text-rose-600 dark:text-rose-400">{stats.incorrect} incorrect</span>
        {onUndo && (
          <button
            onClick={onUndo}
            className="rounded-lg px-2 py-0.5 text-xs font-medium text-indigo-500 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            Undo
          </button>
        )}
      </div>
      <div className="flex gap-4">
        {attempted > 0 && <span>{accuracy}%</span>}
        <span>{remaining}/{total} due</span>
      </div>
    </div>
  );
}
