'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({
  children,
  initialLang,
  initialTheme
}: {
  children: ReactNode;
  initialLang: 'en' | 'ar';
  initialTheme: 'dark' | 'light';
}) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } }
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
