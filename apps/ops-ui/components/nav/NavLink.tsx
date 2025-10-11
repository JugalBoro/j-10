'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  collapsed?: boolean;
  className?: string;
}

export function NavLink({ href, icon: Icon, children, collapsed = false, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-gray-100 dark:hover:bg-slate-800",
        "focus:outline-none focus:shadow-[0_0_0_3px_rgba(79,70,229,0.35)]",
        isActive && "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
        !isActive && "text-gray-700 dark:text-gray-300",
        collapsed && "justify-center px-2",
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", collapsed && "h-5 w-5")} />
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            {children}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
