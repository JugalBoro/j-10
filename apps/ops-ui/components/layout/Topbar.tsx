'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Get breadcrumb from pathname
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    // TODO: Implement theme toggle with next-themes
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-slate-900",
        className
      )}
    >
      {/* Left side - Breadcrumb */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getBreadcrumb()}
        </h1>
        <Badge variant="outline" className="text-xs">
          {process.env.NODE_ENV?.toUpperCase() || 'DEV'}
        </Badge>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
            <span className="sr-only">3 new notifications</span>
          </span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="h-8 gap-2 px-2"
          >
            <div className="h-6 w-6 rounded-full bg-brand-600 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            {session?.user?.name && (
              <span className="hidden sm:block text-sm font-medium">
                {session.user.name}
              </span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>

          {/* User dropdown menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.role || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.orgId || 'No organization'}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-3 text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start h-8 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
