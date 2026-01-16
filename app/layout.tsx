import './globals.css';
import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth-layout';

export const metadata: Metadata = { 
  title: 'KiddyCare', 
  description: 'Baby Product Management System',
  other: {
    'font-preload': 'true',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <head>
        {/* Preload critical font files for immediate loading */}
        <link
          rel="preload"
          href="/fonts/LINESeedSansTH_W_Rg.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/LINESeedSansTH_W_Bd.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/LINESeedSansTH_W_Th.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 font-sans">
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}



