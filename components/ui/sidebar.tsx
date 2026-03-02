'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/components/utils/cn';
import { useSidebar } from './sidebar-context';

interface MenuItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface MenuGroup {
  title: string;
  items: (MenuItem | {
    name: string;
    icon?: React.ReactNode;
    children: MenuItem[];
  })[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'General',
    items: [
      { name: 'หน้าแรก', href: '/', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )},
      { name: 'ประเภทสินค้า', href: '/categories', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )},
      { name: 'สินค้าทั้งหมด', href: '/products', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )},
      { name: 'สินค้าในคลัง', href: '/inventory', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )},
      { name: 'ที่จัดเก็บสินค้า', href: '/warehouse-stock', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )},
      { name: 'รายการสั่งซื้อ', href: '/orders', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )},
      { name: 'ตรวจสอบรีวิว', href: '/reviews', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )},
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'จัดการสิทธิ์การเข้าถึง', href: '/user-permissions', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )},
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.ok && data.user) {
          setUserRole(data.user.StaffRole?.toLowerCase() || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleExpand = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-border transition-all duration-300 z-50',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src="/KiddyCareLogo.png" 
                alt="KiddyCare Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">KiddyCare</span>
              <span className="text-xs text-muted-foreground">Product Management</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            {/* Logo hidden when collapsed */}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
            isCollapsed && "mx-auto"
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="overflow-y-auto h-[calc(100vh-8rem)] py-4">
        {menuGroups.map((group) => {
          // Filter menu items based on user role
          const filteredItems = group.items.filter((item) => {
            // Hide "จัดการสิทธิ์การเข้าถึง" for staff
            if ('href' in item && item.href === '/user-permissions') {
              return userRole !== 'staff';
            }
            return true;
          });

          // Don't render the group if no items remain
          if (filteredItems.length === 0) {
            return null;
          }

          return (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                if ('children' in item) {
                  // Menu item with children (collapsible)
                  const isExpanded = expandedItems.has(item.name);
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleExpand(item.name)}
                        className={cn(
                          'w-full flex items-center px-4 py-2.5 text-sm font-medium transition-colors',
                          'text-muted-foreground hover:text-foreground hover:bg-accent',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        {item.icon && (
                          <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
                            {item.icon}
                          </span>
                        )}
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            <svg
                              className={cn(
                                'w-4 h-4 transition-transform',
                                isExpanded && 'rotate-90'
                              )}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>
                      {!isCollapsed && isExpanded && (
                        <div className="ml-4 space-y-1">
                          {item.children.map((child) => {
                            const isActive = isItemActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'flex items-center px-4 py-2 text-sm transition-colors',
                                  isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                              >
                                {child.icon && <span className="mr-3 flex-shrink-0">{child.icon}</span>}
                                <span>{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Regular menu item
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        isCollapsed && 'justify-center'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {item.icon && (
                        <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
                          {item.icon}
                        </span>
                      )}
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                }
              })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-white">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center px-4 py-3 text-sm font-medium transition-colors',
            'text-red-600 hover:text-red-700 hover:bg-red-50',
            isCollapsed && 'justify-center',
            isLoggingOut && 'opacity-50 cursor-not-allowed'
          )}
          title={isCollapsed ? 'ออกจากระบบ' : undefined}
        >
          <svg
            className={cn('w-4 h-4 flex-shrink-0', !isCollapsed && 'mr-3')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>{isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>}
        </button>
      </div>
    </aside>
  );
}

