'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/utils/cn';

const navigationItems = [
  { name: 'หน้าแรก', href: '/' },
  { name: 'ประเภทสินค้า', href: '/categories' },
  { name: 'สินค้าทั้งหมด', href: '/products' },
  { name: 'รายการสั่งซื้อ', href: '/orders' },
  { name: 'คลังสินค้า', href: '/inventory' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Left Side */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img 
                src="/KiddyCareLogo.png" 
                alt="KiddyCare Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold">KiddyCare</span>
            </div>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings - Right Side */}
          <div className="flex items-center space-x-4">
            {/* Settings Button */}
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              ตั้งค่า
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="bg-background inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
