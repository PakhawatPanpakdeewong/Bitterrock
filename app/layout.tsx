import './globals.css';
import type { Metadata } from 'next';
import { Navigation } from '@/components/ui/navigation';

export const metadata: Metadata = { title: 'KiddyCare', description: 'Baby Product Management System' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}



