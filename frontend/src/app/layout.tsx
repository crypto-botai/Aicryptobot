import type { Metadata, Viewport } from 'next';
import Providers from '@/components/providers/Providers';
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
        <Providers>
          <div className="animated-bg" aria-hidden="true" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
