import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar-context';
import { LayoutContent } from '@/components/ui/layout-content';

export const metadata: Metadata = { title: 'KiddyCare', description: 'Baby Product Management System' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <SidebarProvider>
          <div className="flex">
            <Sidebar />
            <LayoutContent>{children}</LayoutContent>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}



