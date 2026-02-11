'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { BarChart3, Cog, History, Home, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/ai-history', label: '分析历史', icon: History },
  { href: '/dashboard/sim-trade', label: '模拟交易', icon: BarChart3 },
  { href: '/dashboard/settings', label: '设置', icon: Cog },
];

function NavLinkContent({
  href,
  label,
  icon: Icon,
  pathname,
  isHome,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  isHome: boolean;
}) {
  const isActive =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  if (isHome) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? 'border border-purple-400/40 bg-white/10 text-white/95'
            : 'text-white/70 hover:bg-white/5 hover:text-white/85'
        }`}
        style={
          isActive
            ? {
                background:
                  'linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(34, 211, 238, 0.08))',
                boxShadow: '0 0 12px rgba(124, 58, 237, 0.2)',
              }
            : undefined
        }>
        <Icon className='size-4 shrink-0' />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'border border-blue-400/50 text-blue-800'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
      style={
        isActive
          ? {
              background:
                'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.15)',
            }
          : undefined
      }>
      <Icon className='size-4 shrink-0' />
      <span>{label}</span>
    </Link>
  );
}

export default function TopNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === '/';

  const headerClass = isHome
    ? 'fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-white/10 bg-black/60 px-4 backdrop-blur-md sm:px-6 md:px-8'
    : 'fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 md:px-8';

  const logoClass = isHome
    ? 'hidden shrink-0 text-lg font-medium tracking-[0.2em] text-white/90 transition-opacity hover:opacity-90 md:block md:text-xl'
    : 'hidden shrink-0 text-lg font-medium tracking-[0.2em] text-slate-800 transition-opacity hover:opacity-90 md:block md:text-xl';

  const menuBtnClass = isHome
    ? 'flex shrink-0 items-center justify-center rounded-lg p-2 text-white/90 transition-opacity hover:bg-white/5 hover:opacity-90 md:hidden'
    : 'flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-700 transition-opacity hover:bg-slate-100 hover:opacity-90 md:hidden';

  const usernameClass = isHome
    ? 'hidden text-sm text-white/80 sm:inline'
    : 'hidden text-sm text-slate-600 sm:inline';

  const logoutBtnClass = isHome
    ? 'rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90'
    : 'rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition-opacity hover:bg-slate-100';

  const loginLinkClass = isHome
    ? 'rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90'
    : 'rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition-opacity hover:bg-slate-100';

  return (
    <>
      <header className={headerClass} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className='flex min-w-0 flex-1 items-center gap-6'>
          {isAuthenticated && (
            <button
              type='button'
              onClick={() => setMenuOpen(true)}
              className={menuBtnClass}
              aria-label='打开菜单'>
              <Menu className='size-6' />
            </button>
          )}
          <Link href='/' className={logoClass}>
            阿尔法策略
          </Link>
          {isAuthenticated && (
            <nav
              className={`hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto ${
                pathname.startsWith('/dashboard') ? '' : 'md:flex'
              }`}>
              {navItems.map(({ href, label, icon }) => (
                <NavLinkContent
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  pathname={pathname}
                  isHome={isHome}
                />
              ))}
            </nav>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-3'>
          {isAuthenticated && user ? (
            <>
              <span className={usernameClass}>{user.username}</span>
              <button
                type='button'
                onClick={() => logout()}
                className={logoutBtnClass}
                style={{ borderWidth: '1px' }}
                aria-label='退出'>
                退出
              </button>
            </>
          ) : (
            <Link
              href='/login'
              className={loginLinkClass}
              style={{ borderWidth: '1px' }}
              aria-label='登录'>
              登录
            </Link>
          )}
        </div>
      </header>

      {isAuthenticated && menuOpen && (
        <div className='fixed inset-0 z-60 md:hidden'>
          <button
            type='button'
            aria-label='关闭菜单'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 flex h-full w-64 flex-col gap-2 border-r p-4 backdrop-blur-md ${
              isHome
                ? 'border-white/10 bg-black/95'
                : 'border-slate-200 bg-white'
            }`}
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            <button
              type='button'
              onClick={() => setMenuOpen(false)}
              className={
                isHome
                  ? 'flex w-full justify-end rounded-lg p-2 text-white/90 transition-opacity hover:bg-white/5'
                  : 'flex w-full justify-end rounded-lg p-2 text-slate-700 transition-opacity hover:bg-slate-100'
              }
              aria-label='关闭菜单'>
              <X className='size-6' />
            </button>
            <nav className='flex flex-col gap-1'>
              {navItems.map(({ href, label, icon }) => (
                <div key={href} onClick={() => setMenuOpen(false)}>
                  <NavLinkContent
                    href={href}
                    label={label}
                    icon={icon}
                    pathname={pathname}
                    isHome={isHome}
                  />
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
