import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { ThemeToggle } from '../components/ThemeToggle';

export function Home() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">French Practice</h1>
        <ThemeToggle />
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-4">
        <button
          onClick={() => navigate('/practice-setup')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Verb Conjugation</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Practice French verb forms with flashcards
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate('/listening-setup')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
              <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Listening Practice</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Listen to French sentences and test comprehension
            </p>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => navigate('/settings')}
          className="w-full rounded-xl py-3 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Settings
        </button>
      </div>
    </PageLayout>
  );
}
