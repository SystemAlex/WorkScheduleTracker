import * as React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  id?: string;
  tabIndex?: number;
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn('flex h-screen overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function LayoutSidebar({ children, className }: LayoutProps) {
  return (
    <aside className={cn('w-auto bg-white shadow-lg flex flex-col', className)}>
      {children}
    </aside>
  );
}

export function LayoutMain({ id, tabIndex, children, className }: LayoutProps) {
  return (
    <main
      id={id}
      tabIndex={tabIndex}
      className={cn('flex-1 flex flex-col overflow-hidden', className)}
    >
      {children}
    </main>
  );
}

export function LayoutHeader({ children, className }: LayoutProps) {
  return (
    <header
      className={cn(
        'bg-white shadow-sm border-b border-neutral-200 px-4 py-4',
        className,
      )}
    >
      {children}
    </header>
  );
}

export function LayoutContent({ children, className }: LayoutProps) {
  return (
    <div className={cn('flex-1 p-0 overflow-auto', className)}>{children}</div>
  );
}

export function LayoutPanel({ children, className }: LayoutProps) {
  return (
    <aside
      className={cn(
        'w-80 bg-white shadow-lg border-l border-neutral-200 flex flex-col',
        className,
      )}
    >
      {children}
    </aside>
  );
}
