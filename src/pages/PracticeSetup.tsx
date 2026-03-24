import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { TENSES } from '../lib/constants';
import type { TenseKey, Direction } from '../lib/types';

export function PracticeSetup() {
  const navigate = useNavigate();
  const { direction, setDirection, showInfinitive, setShowInfinitive, tenses, setTenses } = usePracticeSettings();

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      if (tenses.length > 1) setTenses(tenses.filter((t) => t !== tense));
    } else {
      setTenses([...tenses, tense]);
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
                onClick={() => setDirection(d)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  direction === d
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {d === 'en-fr' ? 'English \u2192 French' : 'French \u2192 English'}
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
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700"
        >
          Start Practice
        </button>
      </div>
    </PageLayout>
  );
}
