import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'AICryptoBot', template: '%s | AICryptoBot' },
  description: 'Enterprise AI-powered crypto trading platform with multi-model validation and self-learning engines.',
  applicationName: 'AICryptoBot',
  keywords: ['crypto', 'trading', 'AI', 'bot', 'automated', 'bitcoin', 'ethereum'],
  authors: [{ name: 'AICryptoBot' }],
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'AICryptoBot' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-dark-950 text-slate-100 antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="animated-bg" aria-hidden="true" />
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
      </body>
    </html>
  );
}
