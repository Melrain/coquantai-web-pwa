'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';

const DEFAULT_STEPS = [
  '[Graph] Node: Data_Cleaning... OK',
  '[Graph] Node: OI_Aggregate... OK',
  '[Graph] Edge: Exchange_1 -> Core...',
  '[Graph] Node: LangGraph.Core... running',
  'Report generating...',
];

const CHAR_DELAY_MS = 60;
const STEP_PAUSE_MS = 1200;
const LOOP_PAUSE_MS = 800;

type TypewriterLogProps = {
  steps?: string[];
  charDelayMs?: number;
  stepPauseMs?: number;
  loopPauseMs?: number;
  className?: string;
  onStepComplete?: () => void;
};

const TypewriterLog = memo(function TypewriterLog({
  steps = DEFAULT_STEPS,
  charDelayMs = CHAR_DELAY_MS,
  stepPauseMs = STEP_PAUSE_MS,
  loopPauseMs = LOOP_PAUSE_MS,
  className = '',
  onStepComplete,
}: TypewriterLogProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'hold' | 'loop'>('typing');
  const onStepCompleteRef = useRef(onStepComplete);
  onStepCompleteRef.current = onStepComplete;

  const currentStep = useMemo(() => steps[stepIndex] ?? '', [steps, stepIndex]);
  const currentStepLength = useMemo(() => currentStep.length, [currentStep]);
  const displayText = useMemo(
    () => currentStep.slice(0, charIndex),
    [currentStep, charIndex]
  );

  useEffect(() => {
    if (steps.length === 0) return;

    if (phase === 'typing') {
      if (charIndex >= currentStepLength) {
        onStepCompleteRef.current?.();
        setPhase('hold');
        return;
      }
      const t = setTimeout(() => setCharIndex((c) => c + 1), charDelayMs);
      return () => clearTimeout(t);
    }

    if (phase === 'hold') {
      const t = setTimeout(() => {
        setPhase('loop');
      }, stepPauseMs);
      return () => clearTimeout(t);
    }

    if (phase === 'loop') {
      const t = setTimeout(() => {
        setCharIndex(0);
        setStepIndex((i) => (i + 1) % steps.length);
        setPhase('typing');
      }, loopPauseMs);
      return () => clearTimeout(t);
    }
  }, [
    phase,
    charIndex,
    currentStepLength,
    steps.length,
    stepIndex,
    charDelayMs,
    stepPauseMs,
    loopPauseMs,
  ]);

  return (
    <div
      className={`font-mono text-sm text-white/85 min-h-6 ${className}`}
      style={{
        textShadow:
          '0 0 8px rgba(255,255,255,0.25), 0 0 16px rgba(177, 158, 239, 0.15)',
        letterSpacing: '0.15em', // 增加字间距，让文字看起来像是光线交织后"吐"出的逻辑代码
      }}
      aria-live='polite'
      aria-atomic='true'>
      <span>{displayText}</span>
      <span
        className='animate-pulse'
        aria-hidden>
        |
      </span>
    </div>
  );
});

export default TypewriterLog;
