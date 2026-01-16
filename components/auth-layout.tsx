'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar-context';
import { LayoutContent } from '@/components/ui/layout-content';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <Sidebar />
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}

