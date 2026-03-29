import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  title: string;
  rightElement?: React.ReactNode;
  backTo?: string;
}

export function Navigation({ title, rightElement, backTo }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate(backTo ?? '/')}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Go back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="w-9">{rightElement}</div>
    </div>
  );
}
