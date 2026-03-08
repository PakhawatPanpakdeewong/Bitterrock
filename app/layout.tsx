import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthLayout } from '@/components/auth-layout';

const lineSeedSans = localFont({
  variable: '--font-line-seed',
  display: 'swap',
  src: [
    { path: './fonts/LINESeedSansTH_W_Th.woff2', weight: '100', style: 'normal' },
    { path: './fonts/LINESeedSansTH_W_Rg.woff2', weight: '400', style: 'normal' },
    { path: './fonts/LINESeedSansTH_W_Bd.woff2', weight: '700', style: 'normal' },
    { path: './fonts/LINESeedSansTH_W_He.woff2', weight: '800', style: 'normal' },
    { path: './fonts/LINESeedSansTH_W_XBd.woff2', weight: '900', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: 'KiddyCare',
  description: 'Baby Product Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lineSeedSans.variable}>
      <body className="min-h-screen bg-white text-gray-900 font-sans">
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}



