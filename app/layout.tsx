import type { Metadata, Viewport } from 'next';
import { Noto_Sans_SC, Geist_Mono } from 'next/font/google';
import { PWAInstallProvider } from '@/contexts/PWAInstallContext';
import InstallPrompt from '@/components/InstallPrompt';
import { SerwistProvider } from './serwist';
import './globals.css';

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
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
            {children}
            <InstallPrompt />
          </PWAInstallProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
