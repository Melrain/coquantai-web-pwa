'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores';

export default function TopNavbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header
      className='fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/60 px-4 backdrop-blur-md sm:px-6 md:px-8'
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className='flex h-14 items-center'>
        <Link
          href='/'
          className='text-lg font-medium tracking-[0.2em] text-white/90 transition-opacity hover:opacity-90 sm:text-xl'>
          阿尔法策略
        </Link>
      </div>
      <div className='flex items-center gap-3'>
        {isAuthenticated && user ? (
          <>
            <span className='text-sm text-white/80'>{user.username}</span>
            <button
              type='button'
              onClick={() => logout()}
              className='rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90'
              style={{ borderWidth: '1px' }}
              aria-label='退出'>
              退出
            </button>
          </>
        ) : (
          <Link
            href='/login'
            className='rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90'
            style={{ borderWidth: '1px' }}
            aria-label='登录'>
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
