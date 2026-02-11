'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores';
import GradientText from '@/components/GradientText';

const accentColors = ['#7c3aed', '#a78bfa', '#22d3ee', '#a78bfa'];

export default function HomeLoginBlock() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className='flex flex-1 items-center justify-center px-4'>
      <div
        className='w-full max-w-md rounded-xl border border-white/20 bg-white/5 px-6 py-5 backdrop-blur-md sm:py-6'
        style={{
          borderColor: 'rgba(124, 58, 237, 0.3)',
          boxShadow:
            '0 0 24px rgba(124, 58, 237, 0.15), 0 0 48px rgba(34, 211, 238, 0.08)',
          background:
            'linear-gradient(to bottom, rgba(124, 58, 237, 0.05), rgba(34, 211, 238, 0.05))',
        }}>
        {/* 装饰细线 */}
        <div
          className='mb-5 h-px w-full sm:mb-6'
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(167, 139, 250, 0.5), transparent)',
          }}
          aria-hidden
        />
        {isAuthenticated && user ? (
          <p className='text-center text-sm text-white/90 sm:text-base'>
            欢迎回来，{' '}
            <GradientText
              colors={accentColors}
              animationSpeed={10}
              showBorder={false}>
              {user.username}
            </GradientText>
          </p>
        ) : (
          <div className='flex flex-col items-center gap-4'>
            <p className='text-center text-sm tracking-[0.15em] text-white/85 sm:text-base'>
              登录后可查看完整 AI 分析报告
            </p>
            <Link
              href='/login'
              className='rounded-xl border border-purple-400/40 px-6 py-2.5 text-sm font-medium transition-all hover:border-purple-400/60 hover:shadow-[0_0_16px_rgba(124,58,237,0.25)]'
              style={{
                background:
                  'linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(34, 211, 238, 0.15))',
              }}
              aria-label='立即登录'>
              <GradientText
                colors={accentColors}
                animationSpeed={8}
                showBorder={false}>
                立即登录
              </GradientText>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
