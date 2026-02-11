'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cog, Home, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: Home },
  { href: '/app/ai', label: 'AI 分析', icon: Sparkles },
  { href: '/app/sim-trade', label: '模拟交易', icon: BarChart3 },
  { href: '/app/settings', label: '设置', icon: Cog },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className='flex items-stretch gap-1 rounded-xl border border-white/20 bg-white/5 px-2 py-2 backdrop-blur-md sm:flex-col sm:px-3'
      style={{
        borderColor: 'rgba(124, 58, 237, 0.3)',
        boxShadow:
          '0 0 24px rgba(124, 58, 237, 0.1), 0 0 48px rgba(34, 211, 238, 0.05)',
        background:
          'linear-gradient(to bottom, rgba(124, 58, 237, 0.05), rgba(34, 211, 238, 0.05))',
      }}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/app' ? pathname === '/app' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
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
            <Icon className='size-5 shrink-0' />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
