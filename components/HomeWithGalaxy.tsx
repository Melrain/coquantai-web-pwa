'use client';

import { memo, useMemo } from 'react';
import Galaxy from '@/components/Galaxy';

const HomeWithGalaxy = memo(function HomeWithGalaxy({
  children,
}: {
  children: React.ReactNode;
}) {
  const galaxyProps = useMemo(
    () => ({
      starSpeed: 0.5,
      density: 1,
      hueShift: 140,
      speed: 1,
      glowIntensity: 0.3,
      saturation: 1,
      mouseRepulsion: true,
      repulsionStrength: 2,
      twinkleIntensity: 0.3,
      rotationSpeed: 0.05,
      transparent: true,
    }),
    []
  );

  return (
    <div className='relative min-h-screen w-full'>
      <div className='absolute inset-0 z-0 h-full w-full'>
        <Galaxy {...galaxyProps} />
      </div>
      <div className='relative z-10'>{children}</div>
    </div>
  );
});

export default HomeWithGalaxy;
