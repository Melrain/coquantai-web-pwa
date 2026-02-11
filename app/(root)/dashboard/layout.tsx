'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
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
    <div
      className='relative flex min-h-screen bg-sky-50'
      style={{
        paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 3.5rem))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}>
      <DashboardSidebar />
      <div className='flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 md:ml-60 md:px-8 lg:px-12'>
        <main className='mx-auto w-full max-w-6xl'>{children}</main>
      </div>
    </div>
  );
}
