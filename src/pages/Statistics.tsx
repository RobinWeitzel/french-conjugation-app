import { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { useStatistics, type StatisticsData } from '../hooks/useStatistics';
import { TENSES } from '../lib/constants';
import type { TenseKey } from '../lib/types';

function OverviewCards({ data }: { data: StatisticsData }) {
  const cards = [
    { label: 'Total Cards', value: data.totalCards },
    { label: 'Mastered', value: `${data.mastered} (${data.masteredPercent}%)` },
    { label: 'Accuracy', value: data.totalAnswers > 0 ? `${data.accuracy}%` : '—' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ data }: { data: StatisticsData['dailyActivity'] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.conjugation + d.listening));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Last 14 Days</h3>
      <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Daily activity chart">
        {data.map((day, i) => {
          const x = i * 20;
          const totalHeight = ((day.conjugation + day.listening) / maxCount) * 90;
          const conjHeight = (day.conjugation / maxCount) * 90;
          const listenHeight = (day.listening / maxCount) * 90;
          const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'narrow' });

          return (
            <g key={day.date}>
              {/* Listening bar (bottom) */}
              <rect
                x={x + 2}
                y={100 - totalHeight}
                width={16}
                height={listenHeight}
                rx={2}
                className="fill-amber-400 dark:fill-amber-500"
              />
              {/* Conjugation bar (top) */}
              <rect
                x={x + 2}
                y={100 - totalHeight + listenHeight}
                width={16}
                height={conjHeight}
                rx={2}
                className="fill-indigo-500 dark:fill-indigo-400"
              />
              {/* Day label */}
              <text
                x={x + 10}
                y={115}
                textAnchor="middle"
                className="fill-slate-400 text-[8px] dark:fill-slate-500"
              >
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
          Conjugation
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-amber-400 dark:bg-amber-500" />
          Listening
        </span>
      </div>
    </div>
  );
}

function BoxBar({ boxes, total }: { boxes: Record<number, number>; total: number }) {
  if (total === 0) return null;
  const colors: Record<number, string> = {
    1: 'bg-rose-500',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-lime-400',
    5: 'bg-emerald-500',
  };

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {[1, 2, 3, 4, 5].map((box) => {
        const count = boxes[box] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={box}
            className={`${colors[box]} transition-all`}
            style={{ width: `${pct}%` }}
            title={`Box ${box}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function CollapsibleSection({
  title,
  mastered,
  total,
  boxes,
}: {
  title: string;
  mastered: number;
  total: number;
  boxes: Record<number, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {mastered}/{total} mastered
          <span className="ml-2 inline-block transition-transform" style={{ transform: open ? 'rotate(90deg)' : '' }}>
            ›
          </span>
        </span>
      </button>
      {open && (
        <div className="pb-3">
          <BoxBar boxes={boxes} total={total} />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>Box 1 (new)</span>
            <span>Box 5 (mastered)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Statistics() {
  const data = useStatistics();

  if (!data) {
    return (
      <PageLayout>
        <Navigation title="Statistics" />
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading...</div>
      </PageLayout>
    );
  }

  const tenseKeys = Object.keys(data.tenses) as TenseKey[];
  const categoryKeys = Object.keys(data.listeningCategories).sort();

  return (
    <PageLayout>
      <Navigation title="Statistics" />

      <div className="mt-4 flex flex-col gap-6">
        <OverviewCards data={data} />
        <ActivityChart data={data.dailyActivity} />

        <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Conjugation by Tense
          </h3>
          {tenseKeys.length === 0 ? (
            <p className="pb-3 text-sm text-slate-400">No conjugation data yet</p>
          ) : (
            tenseKeys.map((tk) => (
              <CollapsibleSection
                key={tk}
                title={TENSES[tk] ?? tk}
                mastered={data.tenses[tk]!.mastered}
                total={data.tenses[tk]!.total}
                boxes={data.tenses[tk]!.boxes}
              />
            ))
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Listening by Category
          </h3>
          {categoryKeys.length === 0 ? (
            <p className="pb-3 text-sm text-slate-400">No listening data yet</p>
          ) : (
            categoryKeys.map((cat) => (
              <CollapsibleSection
                key={cat}
                title={cat}
                mastered={data.listeningCategories[cat]!.mastered}
                total={data.listeningCategories[cat]!.total}
                boxes={data.listeningCategories[cat]!.boxes}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
