import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Noto_Sans_SC, Geist_Mono } from 'next/font/google';
import { PWAInstallProvider } from '@/contexts/PWAInstallContext';
import { AuthProvider } from '@/contexts/AuthContext';
import InstallPrompt from '@/components/InstallPrompt';
import TopNavbar from '@/components/TopNavbar';
import AuthInit from '@/components/AuthInit';
import { SerwistProvider } from './serwist';
import './globals.css';

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  // @ts-expect-error Noto_Sans_SC supports chinese-simplified but types are narrow
  subsets: ['latin', 'chinese-simplified'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_NAME = 'CoQuantAI';
const APP_DEFAULT_TITLE = 'CoQuantAI';
const APP_DESCRIPTION = 'CoQuantAI PWA';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: { default: APP_DEFAULT_TITLE, template: `%s - ${APP_NAME}` },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: { default: APP_DEFAULT_TITLE, template: `%s - ${APP_NAME}` },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='zh-CN'
      className='min-h-full bg-black'
      suppressHydrationWarning>
      <body
        className={`${notoSansSC.variable} ${geistMono.variable} antialiased min-h-screen bg-black text-white font-sans`}>
        <SerwistProvider swUrl='/serwist/sw.js'>
          <PWAInstallProvider>
            <AuthProvider>
              <AuthInit />
              <Suspense
                fallback={
                  <header
                    className='fixed left-0 right-0 top-0 z-50 h-14 border-b border-white/10 bg-black/60 backdrop-blur-md'
                    style={{ paddingTop: 'env(safe-area-inset-top)' }}
                    aria-hidden
                  />
                }>
                <TopNavbar />
              </Suspense>
              {children}
              <InstallPrompt />
            </AuthProvider>
          </PWAInstallProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
