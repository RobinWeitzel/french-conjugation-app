import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { TENSES, PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from '../lib/constants';
import { db } from '../lib/db';
import type { TenseKey, Direction, InputMode } from '../lib/types';

function useTierUnlockStatus(tenses: TenseKey[]) {
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>({ 1: true });
  const [progress, setProgress] = useState<Record<number, { current: number; total: number }>>({});

  useEffect(() => {
    const compute = async () => {
      const newUnlocked: Record<number, boolean> = { 1: true };
      const newProgress: Record<number, { current: number; total: number }> = {};

      for (let i = 0; i < VERB_TIERS.length; i++) {
        const tier = VERB_TIERS[i]!;
        let total = 0;
        let atLevel = 0;
        const tierVerbs = tier.verbs.length > 0 ? tier.verbs : [];

        if (tierVerbs.length === 0) {
          newUnlocked[tier.id] = newUnlocked[tier.id - 1] ?? false;
          continue;
        }

        for (const infinitive of tierVerbs) {
          for (const tense of tenses) {
            for (const pronoun of PRONOUNS) {
              const statId = `${infinitive}_${pronoun}_${tense}`;
              total++;
              const stat = await db.stats.get(statId);
              if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
                atLevel++;
              }
            }
          }
        }

        newProgress[tier.id] = { current: atLevel, total };

        if (i + 1 < VERB_TIERS.length) {
          const ratio = total > 0 ? atLevel / total : 0;
          newUnlocked[VERB_TIERS[i + 1]!.id] = (newUnlocked[tier.id] ?? false) && ratio >= TIER_UNLOCK_THRESHOLD;
        }
      }

      setUnlocked(newUnlocked);
      setProgress(newProgress);
    };

    compute();
  }, [tenses]);

  return { unlocked, progress };
}

export function PracticeSetup() {
  const navigate = useNavigate();
  const {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    inputMode, setInputMode,
    tiers, setTiers,
  } = usePracticeSettings();

  const { unlocked, progress } = useTierUnlockStatus(tenses);

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      setTenses(tenses.filter((t) => t !== tense));
    } else {
      setTenses([...tenses, tense]);
    }
  };

  const toggleTier = (tierId: number) => {
    if (!unlocked[tierId]) return;
    if (tiers.includes(tierId)) {
      if (tiers.length > 1) {
        setTiers(tiers.filter((t) => t !== tierId));
      }
    } else {
      setTiers([...tiers, tierId]);
    }
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
                onClick={() => {
                  setDirection(d);
                  if (d === 'fr-en') setInputMode('flashcard');
                }}
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

        {/* Input Mode — only available for en-fr direction */}
        {direction === 'en-fr' && (
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Input Mode</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {(['flashcard', 'typing'] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  inputMode === m
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'flashcard' ? 'Flashcard' : 'Typing'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {inputMode === 'flashcard' ? 'Flip and swipe to self-grade' : 'Type the conjugation for a harder drill'}
          </p>
        </div>
        )}

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

        {/* Verb Tiers */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Verb Groups</label>
          <div className="space-y-2">
            {VERB_TIERS.map((tier) => {
              const isUnlocked = unlocked[tier.id] ?? false;
              const isSelected = tiers.includes(tier.id);
              const tierProgress = progress[tier.id];

              return (
                <button
                  key={tier.id}
                  onClick={() => toggleTier(tier.id)}
                  disabled={!isUnlocked}
                  className={`flex w-full flex-col gap-1 rounded-xl px-4 py-3 text-left transition-colors ${
                    !isUnlocked
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400 opacity-60 dark:bg-slate-800/30 dark:text-slate-600'
                      : isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-5 items-center justify-center rounded border ${
                        !isUnlocked
                          ? 'border-slate-300 dark:border-slate-700'
                          : isSelected
                            ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                            : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {!isUnlocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                        </svg>
                      ) : isSelected ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        Tier {tier.id}: {tier.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                        {tier.verbs.length > 0 ? `${tier.verbs.length} verbs` : 'remaining verbs'}
                      </span>
                    </div>
                  </div>
                  {!isUnlocked && tierProgress && (
                    <div className="ml-8 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-indigo-400 transition-all"
                            style={{ width: `${tierProgress.total > 0 ? Math.min((tierProgress.current / (tierProgress.total * TIER_UNLOCK_THRESHOLD)) * 100, 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {tierProgress.current}/{Math.ceil(tierProgress.total * TIER_UNLOCK_THRESHOLD)}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="ml-8 text-xs text-slate-400 dark:text-slate-500">{tier.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tense selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Tenses</label>
          <div className="space-y-2">
            {(Object.entries(TENSES) as [TenseKey, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toggleTense(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  tenses.includes(key)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`flex size-5 items-center justify-center rounded border ${
                    tenses.includes(key)
                      ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {tenses.includes(key) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
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
