import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function LayoutSidebar({ children, className }: LayoutProps) {
  return (
    <aside className={cn("w-64 bg-white shadow-lg flex flex-col", className)}>
      {children}
    </aside>
  );
}

export function LayoutMain({ children, className }: LayoutProps) {
  return (
    <main className={cn("flex-1 flex flex-col overflow-hidden", className)}>
      {children}
    </main>
  );
}

export function LayoutHeader({ children, className }: LayoutProps) {
  return (
    <header className={cn("bg-white shadow-sm border-b border-neutral-200 px-6 py-4", className)}>
      {children}
    </header>
  );
}

export function LayoutContent({ children, className }: LayoutProps) {
  return (
    <div className={cn("flex-1 p-6 overflow-auto", className)}>
      {children}
    </div>
  );
}

export function LayoutPanel({ children, className }: LayoutProps) {
  return (
    <aside className={cn("w-80 bg-white shadow-lg border-l border-neutral-200 flex flex-col", className)}>
      {children}
    </aside>
  );
}
