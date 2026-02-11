'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeWithGalaxy from '@/components/HomeWithGalaxy';
import BlurText from '@/components/BlurText';
import HomeLoginBlock from '@/components/HomeLoginBlock';
import { useAuthStore } from '@/stores';
import { FaGlobe } from 'react-icons/fa';
import { SiApple, SiGoogleplay } from 'react-icons/si';

export default function Page() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);
  const blurTextGradientColors = useMemo(
    () => ['#7c3aed', '#a78bfa', '#22d3ee', '#a78bfa'],
    []
  );

  return (
    <HomeWithGalaxy>
      <div
        className='relative flex min-h-screen flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-12'
        style={{
          paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 3.5rem))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}>
        {/* 核心区：主标题 + 副标题 */}
        <div className='relative flex shrink-0 flex-col items-center justify-center py-4'>
          <section className='relative z-10 flex flex-col items-center justify-center'>
            <h1 className='hero-title-glow text-center text-4xl font-semibold tracking-[0.23em] sm:text-5xl md:text-6xl md:tracking-[0.29em] lg:text-7xl'>
              <BlurText
                text='AI 驱动的分析引擎'
                delay={150}
                animateBy='characters'
                direction='top'
                gradientColors={blurTextGradientColors}
                gradientAnimationSpeed={8}
              />
            </h1>
            <span
              className='mt-5 block h-px w-12 bg-white/30 sm:mt-6'
              aria-hidden
            />
            <p className='mt-5 text-center text-sm tracking-[0.25em] text-white/80 sm:mt-6'>
              全网数据 · 多AI分析 · 预测呈现
            </p>
          </section>
        </div>

        {/* 登录区 */}
        <HomeLoginBlock />

        {/* 行动区：下载按钮 */}
        <div className='flex shrink-0 flex-col items-center justify-end'>
          <section
            className='flex w-full max-w-md flex-col items-stretch justify-center gap-3 pb-6 sm:flex-row sm:items-center sm:gap-4 sm:pb-8'
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            <a
              href='#'
              className='flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90 sm:min-w-[160px]'
              style={{ borderWidth: '1px' }}
              aria-label='iOS 下载'>
              <SiApple className='size-5 shrink-0' />
              <span>iOS 下载</span>
            </a>
            <a
              href='#'
              className='flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-white/90 backdrop-blur-sm transition-opacity hover:opacity-90 sm:min-w-[160px]'
              style={{ borderWidth: '1px' }}
              aria-label='谷歌下载'>
              <SiGoogleplay className='size-5 shrink-0' />
              <span>谷歌下载</span>
            </a>
            <a
              href='#'
              className='flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-white/90 backdrop-blur-sm transition-opacity hover:opacity-100 sm:min-w-[140px]'
              style={{ borderWidth: '1px' }}
              aria-label='继续浏览器进入'>
              <FaGlobe className='size-5 shrink-0' />
              <span>浏览器</span>
            </a>
          </section>

          <p className='mb-4 text-center text-xs text-white/65 sm:mb-6'>
            空织记忆™ 出品
          </p>
        </div>
      </div>
    </HomeWithGalaxy>
  );
}
