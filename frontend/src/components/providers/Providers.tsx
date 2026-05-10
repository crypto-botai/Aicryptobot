'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#020617' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#020617' } },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
