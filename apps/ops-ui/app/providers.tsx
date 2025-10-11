'use client';

import { SessionProvider } from 'next-auth/react';
import { ApiQueryProvider } from '@/lib/api/query';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiQueryProvider>
        {children}
      </ApiQueryProvider>
    </SessionProvider>
  );
}