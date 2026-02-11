'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeWithGalaxy from '@/components/HomeWithGalaxy';
import AppNav from '@/components/AppNav';
import { useAuthStore } from '@/stores';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <HomeWithGalaxy>
      <div
        className='relative flex min-h-screen flex-col px-4 py-6 sm:flex-row sm:gap-6 sm:px-6 sm:py-8 md:px-8 lg:px-12'
        style={{
          paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 3.5rem))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}>
        <aside className='mb-4 shrink-0 sm:mb-0 sm:w-48'>
          <AppNav />
        </aside>
        <main className='min-w-0 flex-1'>{children}</main>
      </div>
    </HomeWithGalaxy>
  );
}
