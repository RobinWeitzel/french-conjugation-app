import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { useListeningSettings } from '../hooks/useSettings';
import { useSentenceCategories } from '../hooks/useDatabase';

export function ListeningSetup() {
  const navigate = useNavigate();
  const { categories, setCategories } = useListeningSettings();
  const allCategories = useSentenceCategories();

  const toggleCategory = (key: string) => {
    if (categories.includes(key)) {
      setCategories(categories.filter((c) => c !== key));
    } else {
      setCategories([...categories, key]);
    }
  };

  const selectAll = () => {
    if (allCategories) setCategories(Object.keys(allCategories));
  };

  if (!allCategories) {
    return (
      <PageLayout>
        <Navigation title="Listening Setup" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading categories...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation title="Listening Setup" />

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Categories</label>
          <button onClick={selectAll} className="text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
            Select all
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(allCategories).map(([key, name]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                categories.includes(key)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div
                className={`flex size-5 items-center justify-center rounded border ${
                  categories.includes(key)
                    ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {categories.includes(key) && (
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

      <div className="mt-auto pt-8">
        <button
          onClick={() => navigate('/listening')}
          disabled={categories.length === 0}
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Listening
        </button>
      </div>
    </PageLayout>
  );
}
