'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useMemo, memo } from 'react';
import type { FC } from 'react';

type BlurTextProps = {
  text: string;
  delay?: number;
  animateBy?: 'words' | 'characters';
  direction?: 'top' | 'bottom' | 'left' | 'right';
  onAnimationComplete?: () => void;
  className?: string;
  gradientColors?: string[];
  gradientAnimationSpeed?: number;
};

const directionOffset = {
  top: { y: -12 },
  bottom: { y: 12 },
  left: { x: -12 },
  right: { x: 12 },
};

const BlurText: FC<BlurTextProps> = ({
  text,
  delay = 0,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className,
  gradientColors,
  gradientAnimationSpeed = 8,
}) => {
  const items = useMemo(
    () =>
      animateBy === 'words'
        ? text.split(/\s+/).filter(Boolean)
        : text.split(''),
    [text, animateBy]
  );

  const offset = useMemo(() => directionOffset[direction], [direction]);

  const gradientStyle = useMemo(() => {
    if (!gradientColors || gradientColors.length === 0) return undefined;

    const period =
      gradientColors.length <= 1
        ? gradientColors
        : [
            ...gradientColors,
            ...gradientColors.slice(1, -1).reverse(),
            gradientColors[0],
          ];
    const colors = [...period, ...period];
    return {
      backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
      backgroundSize: '200% 100%',
      backgroundClip: 'text' as const,
      WebkitBackgroundClip: 'text' as const,
      color: 'transparent',
      animation: `gradient-text-flow ${gradientAnimationSpeed}s linear infinite`,
      willChange: 'background-position',
    };
  }, [gradientColors, gradientAnimationSpeed]);

  const staggerMs = 140;
  const durationMs = 900;
  const totalDurationMs = useMemo(
    () =>
      delay +
      (items.length > 0 ? (items.length - 1) * staggerMs + durationMs : 0),
    [delay, items.length]
  );

  useEffect(() => {
    if (!onAnimationComplete || items.length === 0) return;
    const t = setTimeout(onAnimationComplete, totalDurationMs);
    return () => clearTimeout(t);
  }, [onAnimationComplete, items.length, totalDurationMs]);

  return (
    <div
      className={cn(
        'flex flex-wrap justify-center overflow-visible',
        className
      )}>
      {items.map((segment, index) => (
        <motion.span
          key={`${index}-${segment}`}
          className='inline-block'
          style={gradientStyle}
          initial={{
            filter: 'blur(10px)',
            opacity: 0,
            ...('y' in offset ? { y: offset.y } : { x: offset.x }),
          }}
          animate={{
            filter: 'blur(0px)',
            opacity: 1,
            x: 0,
            y: 0,
          }}
          transition={{
            duration: durationMs / 1000,
            delay: delay / 1000 + index * (staggerMs / 1000),
            ease: 'easeOut',
          }}>
          {segment}
          {animateBy === 'words' && index < items.length - 1 ? '\u00A0' : null}
        </motion.span>
      ))}
    </div>
  );
};

export default memo(BlurText);
