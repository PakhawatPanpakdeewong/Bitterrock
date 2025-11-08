'use client'

import { useSidebar } from './sidebar-context';
import { cn } from '@/components/utils/cn';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        'flex-1 min-h-screen transition-all duration-300',
        isCollapsed ? 'ml-16' : 'ml-64'
      )}
    >
      <div className="p-6">
        {children}
      </div>
    </main>
  );
}

