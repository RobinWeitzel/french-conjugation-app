import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, VERB_TIERS, TIER_UNLOCK_THRESHOLD } from '../lib/constants';
import { computeGateStatuses, getFrontierIndex } from '../lib/gates';
import type { TenseKey, Direction, GateStatus } from '../lib/types';

function useAllGateStatuses(
  tenses: TenseKey[],
  direction: Direction,
  allVerbs: string[],
) {
  const [statuses, setStatuses] = useState<Record<TenseKey, GateStatus[]>>({} as Record<TenseKey, GateStatus[]>);

  useEffect(() => {
    if (allVerbs.length === 0) return;

    let cancelled = false;
    const compute = async () => {
      const result: Partial<Record<TenseKey, GateStatus[]>> = {};
      for (const tense of tenses) {
        const s = await computeGateStatuses(tense, direction, allVerbs);
        result[tense] = s;
      }
      if (!cancelled) setStatuses(result as Record<TenseKey, GateStatus[]>);
    };
    compute();

    return () => { cancelled = true; };
  }, [tenses, direction, allVerbs]);

  return statuses;
}

export function PracticeSetup() {
  const navigate = useNavigate();
  const {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    gateOverrides, setGateOverrides,
  } = usePracticeSettings();

  const verbs = useVerbs();
  const allVerbs = useMemo(() => verbs?.map(v => v.infinitive) ?? [], [verbs]);

  const gateStatuses = useAllGateStatuses(tenses, direction, allVerbs);

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      if (tenses.length > 1) {
        setTenses(tenses.filter((t) => t !== tense));
        // Remove gate override for deselected tense
        const newOverrides = { ...gateOverrides };
        delete newOverrides[tense];
        setGateOverrides(newOverrides);
      }
    } else {
      setTenses([...tenses, tense]);
    }
  };

  const handleDirectionChange = (d: Direction) => {
    setDirection(d);
    // Clear all gate overrides when direction changes since chain changes
    setGateOverrides({});
  };

  const handleGateTap = (tense: TenseKey, gateIndex: number, statuses: GateStatus[]) => {
    const frontierIdx = getFrontierIndex(statuses);
    const gate = statuses[gateIndex]?.gate;
    if (!gate) return;

    // Only allow tapping unlocked gates
    if (!statuses[gateIndex]?.unlocked) return;

    const newOverrides = { ...gateOverrides };
    if (gateIndex === frontierIdx) {
      // Tapping frontier removes override (use auto)
      delete newOverrides[tense];
    } else {
      // Set override to this gate
      newOverrides[tense] = { tier: gate.tier, mode: gate.mode };
    }
    setGateOverrides(newOverrides);
  };

  return (
    <PageLayout>
      <Navigation title="Practice Setup" />

      <div className="mt-8 space-y-8">
        {/* Direction */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Direction</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {(['en-fr', 'fr-en'] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDirectionChange(d)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  direction === d
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {d === 'en-fr' ? 'English' : 'French'}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="inline size-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                  {d === 'en-fr' ? 'French' : 'English'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Infinitive hint */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Show infinitive hint</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Display the verb infinitive on cards</p>
          </div>
          <button
            onClick={() => setShowInfinitive(!showInfinitive)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              showInfinitive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
                showInfinitive ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Tense selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Tenses</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(TENSES) as [TenseKey, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toggleTense(key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tenses.includes(key)
                    ? 'bg-indigo-500 text-white shadow-sm dark:bg-indigo-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Per-tense progression */}
        {tenses.length > 0 && (
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Progression</label>
            <div className="space-y-4">
              {tenses.map((tense) => {
                const statuses = gateStatuses[tense];
                if (!statuses || statuses.length === 0) return null;

                const frontierIdx = getFrontierIndex(statuses);
                const override = gateOverrides[tense];

                // Determine active gate index: override or frontier
                const activeIdx = override
                  ? statuses.findIndex(s => s.gate.tier === override.tier && s.gate.mode === override.mode)
                  : frontierIdx;

                const activeGateStatus = statuses[activeIdx >= 0 ? activeIdx : frontierIdx];
                const activeProgress = activeGateStatus?.progress;

                return (
                  <div
                    key={tense}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {TENSES[tense]}
                    </p>

                    {/* Gate chain indicators */}
                    <div className="flex flex-wrap gap-1.5">
                      {statuses.map((status, idx) => {
                        const isCompleted = status.completed;
                        const isActive = idx === (activeIdx >= 0 ? activeIdx : frontierIdx);
                        const isUnlocked = status.unlocked;
                        const isLocked = !isUnlocked;

                        const tierInfo = VERB_TIERS.find(t => t.id === status.gate.tier);
                        const label = status.gate.mode === 'typing'
                          ? `T${status.gate.tier} Type`
                          : `T${status.gate.tier}`;

                        let pillClasses = 'px-2.5 py-1 rounded-full text-xs font-medium transition-all ';
                        if (isCompleted) {
                          pillClasses += 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
                        } else if (isActive) {
                          pillClasses += 'bg-indigo-500 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-400';
                        } else if (isUnlocked) {
                          pillClasses += 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 cursor-pointer dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25';
                        } else {
                          pillClasses += 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500';
                        }

                        return (
                          <button
                            key={`${status.gate.tier}-${status.gate.mode}`}
                            onClick={() => isUnlocked && handleGateTap(tense, idx, statuses)}
                            disabled={isLocked}
                            className={pillClasses}
                            title={
                              isLocked
                                ? `Locked: complete previous gates first`
                                : isCompleted
                                  ? `Completed: ${tierInfo?.name ?? ''} ${status.gate.mode}`
                                  : `${tierInfo?.name ?? ''} ${status.gate.mode}`
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {isCompleted && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              )}
                              {isLocked && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
                                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                                </svg>
                              )}
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Progress bar for active gate */}
                    {activeProgress && activeProgress.total > 0 && !activeGateStatus?.completed && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-indigo-400 transition-all"
                            style={{
                              width: `${Math.min(
                                (activeProgress.current / (activeProgress.total * TIER_UNLOCK_THRESHOLD)) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {activeProgress.current}/{Math.ceil(activeProgress.total * TIER_UNLOCK_THRESHOLD)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={() => navigate('/practice')}
          disabled={tenses.length === 0}
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Practice
        </button>
      </div>
    </PageLayout>
  );
}
