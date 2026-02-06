'use client';

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

type GradientTextProps = {
  colors: string[];
  animationSpeed?: number;
  showBorder?: boolean;
  className?: string;
  children: ReactNode;
};

const GradientText: FC<GradientTextProps> = ({
  colors,
  animationSpeed = 8,
  showBorder = false,
  className,
  children,
}) => {
  const gradientColors =
    colors.length > 0 && colors[0] !== colors[colors.length - 1]
      ? [...colors, colors[0]]
      : colors;
  const gradient = `linear-gradient(90deg, ${gradientColors.join(', ')})`;

  return (
    <span
      className={cn('inline-block', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        animation: `gradient-text-flow ${animationSpeed}s ease infinite`,
        ...(showBorder && {
          WebkitTextStroke: '1px rgba(255,255,255,0.4)',
        }),
      }}>
      {children}
    </span>
  );
};

export default GradientText;
