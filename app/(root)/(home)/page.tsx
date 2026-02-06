'use client';

import { useState, useCallback, useMemo } from 'react';
import HomeWithGalaxy from '@/components/HomeWithGalaxy';
import BlurText from '@/components/BlurText';
import PlexusAlpha from '@/components/PlexusAlpha';
import TypewriterLog from '@/components/TypewriterLog';
import { FaGlobe } from 'react-icons/fa';
import { SiApple, SiGoogleplay } from 'react-icons/si';

const logicSteps = [
  '[图] 节点: 数据清洗... 完成',
  '[图] 节点: 持仓量汇总... 完成',
  '[图] 边: 交易所_1 -> 核心...',
  '[图] 节点: 核心... 运行中',
  '报告生成中...',
];

export default function Page() {
  const [rippleTrigger, setRippleTrigger] = useState(0);

  const handleStepComplete = useCallback(() => {
    setRippleTrigger((t) => t + 1);
  }, []);

  const blurTextGradientColors = useMemo(
    () => ['#7c3aed', '#a78bfa', '#22d3ee', '#a78bfa'],
    []
  );

  return (
    <HomeWithGalaxy>
      <div
        className='flex min-h-screen flex-col justify-between px-4 py-6 pt-[env(safe-area-inset-top)] sm:px-6 sm:py-8 md:px-8 lg:px-12'
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {/* 核心区：标题区 + Plexus 织网 - 整体上移 */}
        <div
          className='relative flex flex-1 flex-col items-center justify-center py-8 sm:py-10'
          style={{ minHeight: '45vh' }}>
          <PlexusAlpha rippleTrigger={rippleTrigger} />
          <section className='relative z-10 flex flex-col items-center justify-center'>
            <h1 className='hero-title-glow text-center text-4xl font-semibold tracking-[0.23em] sm:text-5xl md:text-6xl md:tracking-[0.29em] lg:text-7xl'>
              <BlurText
                text='阿尔法策略'
                delay={200}
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
            <p className='mt-5 text-center text-sm tracking-[0.35em] text-white/75 sm:mt-6 sm:text-base'>
              AI 驱动的分析引擎
            </p>
          </section>
        </div>

        {/* 信息区：打字机日志 - 位于汇聚点正下方 */}
        <div className='relative z-10 flex flex-col items-center justify-center -mt-8 sm:-mt-10'>
          <TypewriterLog
            steps={logicSteps}
            onStepComplete={handleStepComplete}
          />
        </div>

        {/* 行动区：按钮组抬升 - 位于屏幕下三分之一处 */}
        <div className='flex flex-1 flex-col items-center justify-end'>
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

          {/* 品牌背书 - 与按钮拉开距离 */}
          <p className='mb-4 text-center text-xs text-white/65 sm:mb-6'>
            空织记忆™ 出品
          </p>
        </div>
      </div>
    </HomeWithGalaxy>
  );
}
