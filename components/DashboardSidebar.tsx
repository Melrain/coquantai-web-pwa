'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { BarChart3, Cog, History, Home, Trophy } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/ai-history', label: '分析历史', icon: History },
  { href: '/dashboard/sim-trade', label: '模拟交易', icon: BarChart3 },
  { href: '/dashboard/arena', label: '竞技场', icon: Trophy },
  { href: '/dashboard/settings', label: '设置', icon: Cog },
];

function NavLinkContent({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const isActive =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);
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
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.15)',
            }
          : undefined
      }>
      <Icon className='size-4 shrink-0' />
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className='fixed left-0 top-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))] hidden h-[calc(100vh-max(5rem,calc(env(safe-area-inset-top)+3.5rem)))] w-60 flex-col border-r border-slate-200 bg-white md:flex'>
      <div className='flex flex-col gap-2 p-4'>
        {user && (
          <div className='mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
            <p className='text-xs text-slate-500'>登录用户</p>
            <p className='truncate text-sm font-medium text-slate-800'>
              {user.username}
            </p>
          </div>
        )}
        <nav className='flex flex-col gap-1'>
          {navItems.map(({ href, label, icon }) => (
            <NavLinkContent
              key={href}
              href={href}
              label={label}
              icon={icon}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
