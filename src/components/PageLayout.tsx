import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6 ${className}`}>
      {children}
    </div>
  );
}
