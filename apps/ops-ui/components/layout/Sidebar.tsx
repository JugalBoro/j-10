'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { NavLink } from '@/components/nav/NavLink';
import { getVisibleNavItems, type Role } from '@/config/nav';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile detection and initial collapsed state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user role from session
  const userRole = (session?.user?.role as Role) || 'User';
  const visibleNavItems = getVisibleNavItems(userRole);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-white dark:bg-slate-900 transition-all duration-200",
        collapsed ? "w-16" : "w-64",
        isMobile && "fixed inset-y-0 left-0 z-50",
        !isMobile && "sticky top-0 h-screen",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Enterprise Automation
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="h-8 w-8 p-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="Main navigation">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            href={item.path}
            icon={item.icon}
            collapsed={collapsed}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>Build: {process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
