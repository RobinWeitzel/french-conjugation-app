import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { grammarSections } from '../data/grammarData';
import type { GrammarExample } from '../data/grammarData';

function isCommaSeparatedList(text: string): boolean {
  return text.split(',').length >= 4;
}

function renderExample(ex: GrammarExample, exIdx: number) {
  // Split comma-separated lists into vertical items
  if (isCommaSeparatedList(ex.fr)) {
    const items = ex.fr.split(',').map((s) => s.trim());
    return (
      <li key={exIdx} className="flex flex-col gap-1">
        <div className="grid grid-cols-1 gap-0.5 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          {items.map((item, i) => (
            <span
              key={i}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              {item}
            </span>
          ))}
        </div>
        {ex.en && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {ex.en}
          </span>
        )}
      </li>
    );
  }

  return (
    <li key={exIdx} className="flex flex-col">
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
        {ex.fr}
      </span>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {ex.en}
      </span>
    </li>
  );
}

export function GrammarSection() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const section = grammarSections.find((s) => s.id === sectionId);
  const [openTopics, setOpenTopics] = useState<Set<string>>(
    () => new Set(section?.topics[0] ? [section.topics[0].id] : [])
  );

  const toggleTopic = (topicId: string) => {
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  if (!section) {
    return (
      <PageLayout>
        <Navigation title="Not Found" />
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Section not found.</p>
          <Link
            to="/grammar"
            className="mt-4 inline-block text-indigo-600 underline dark:text-indigo-400"
          >
            Back to Grammar
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation title={section.title} />
      <div className="mt-6 space-y-2">
        {section.topics.map((topic) => {
          const isOpen = openTopics.has(topic.id);
          return (
            <div
              key={topic.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <button
                onClick={() => toggleTopic(topic.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {topic.title}
                </h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`size-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                  {topic.entries.map((entry, entryIdx) => (
                    <div key={entryIdx} className="space-y-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {entry.rule}
                      </p>

                      {(entry.examples ?? []).length > 0 && (
                        <ul className="space-y-2 pl-3">
                          {(entry.examples ?? []).map((ex, exIdx) =>
                            renderExample(ex, exIdx)
                          )}
                        </ul>
                      )}

                      {entry.tip && (
                        <div className="flex gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="mt-0.5 size-4 shrink-0 text-blue-500 dark:text-blue-400"
                          >
                            <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .75.75h2.5a.75.75 0 0 0 .75-.75v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.563 7.563 0 0 1-2.274 0Z" />
                          </svg>
                          <p className="text-xs text-blue-800 dark:text-blue-300">
                            {entry.tip}
                          </p>
                        </div>
                      )}

                      {entry.warning && (
                        <div className="flex gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.345 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            {entry.warning}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
