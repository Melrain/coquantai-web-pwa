// @ts-nocheck
'use client';

import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';

type Win = {
  innerWidth: number;
  devicePixelRatio: number;
  addEventListener: (type: string, fn: () => void, opts?: { passive?: boolean }) => void;
  removeEventListener: (type: string, fn: () => void) => void;
};
const getWindow = (): Win | null =>
  typeof globalThis !== 'undefined' && 'window' in globalThis
    ? (globalThis as unknown as { window: Win }).window
    : null;

const EDGE_ALPHA_MIN = 0.12;
const EDGE_ALPHA_MAX = 0.47;
const LINE_PULSE_ALPHA = 0.85;
const PARTICLE_COLOR = '#00f2ff';
const NODE_GLOW = 'rgba(177, 158, 239, 0.5)';
const RIPPLE_DURATION_MS = 600;
const BEZIER_BOW = 0.18;

type Vec2 = { x: number; y: number };

function quadraticBezier(P0: Vec2, P1: Vec2, P2: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => {
    const win = getWindow();
    return win ? win.innerWidth < breakpoint : false;
  });

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const w = getWindow();
        setIsMobile(w ? w.innerWidth < breakpoint : false);
      }, 100);
    };
    win.addEventListener('resize', check, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      const w = getWindow();
      if (w) w.removeEventListener('resize', check);
    };
  }, [breakpoint]);
  return isMobile;
}

const PlexusAlpha = memo(function PlexusAlpha({
  className = '',
  rippleTrigger = 0,
}: {
  className?: string;
  rippleTrigger?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile(640);
  const rippleStartRef = useRef<number | null>(null);
  const prevRippleRef = useRef(rippleTrigger);

  useEffect(() => {
    if (rippleTrigger !== prevRippleRef.current) {
      prevRippleRef.current = rippleTrigger;
      rippleStartRef.current = performance.now();
    }
  }, [rippleTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let width = 0;
    let height = 0;

    const nodeCount = isMobile ? 10 : 20;
    const leftCount = nodeCount / 2;
    const particleCount = isMobile ? 4 : 10;
    const curveSegments = 50;

    const nodes: Vec2[] = [];
    const center: Vec2 = { x: 0, y: 0 };
    const edges: { nodeIndex: number; control: Vec2 }[] = [];
    const particles: { edgeIndex: number; t: number; speed: number }[] = [];

    function resize() {
      const dpr = Math.min(
        2,
        typeof window !== 'undefined' ? window.devicePixelRatio : 1
      );
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
      initEdges();
      initParticles();
    }

    function initNodes() {
      nodes.length = 0;
      center.x = width * 0.5;
      center.y = height * 0.6; // 上移约8%，给下方日志留出视觉中心位

      for (let i = 0; i < leftCount; i++) {
        nodes.push({
          x: width * (0.05 + Math.random() * 0.13),
          y: height * (0.15 + (i / Math.max(1, leftCount - 1)) * 0.7),
        });
      }
      for (let i = 0; i < leftCount; i++) {
        nodes.push({
          x: width * (0.82 + Math.random() * 0.13),
          y: height * (0.15 + (i / Math.max(1, leftCount - 1)) * 0.7),
        });
      }
    }

    function initEdges() {
      edges.length = 0;
      nodes.forEach((node, i) => {
        const mid: Vec2 = {
          x: (node.x + center.x) * 0.5,
          y: (node.y + center.y) * 0.5,
        };
        const dx = center.x - node.x;
        const dy = center.y - node.y;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len;
        const perpY = dx / len;
        const bowSign = i % 2 === 0 ? 1 : -1;
        const control: Vec2 = {
          x: mid.x + perpX * len * BEZIER_BOW * bowSign,
          y: mid.y + perpY * len * BEZIER_BOW * bowSign,
        };
        edges.push({ nodeIndex: i, control });
      });
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          edgeIndex: i % edges.length,
          t: Math.random(),
          speed: 0.25 + Math.random() * 0.35,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const time = performance.now() * 0.001;

      particles.forEach((p) => {
        p.t += 0.003 * p.speed;
        if (p.t > 1) p.t = 0;
      });

      const pulseRadius = 35;
      const particlePositions: Vec2[] = particles.map((p) => {
        const e = edges[p.edgeIndex];
        const node = nodes[e.nodeIndex];
        return quadraticBezier(node, e.control, center, p.t);
      });

      edges.forEach((edge, edgeIndex) => {
        const P0 = nodes[edge.nodeIndex];
        const P1 = edge.control;
        const P2 = center;

        let pulseAlpha = 0;
        particlePositions.forEach((pp, pi) => {
          if (particles[pi].edgeIndex !== edgeIndex) return;
          for (let s = 0; s <= 1; s += 0.02) {
            const pt = quadraticBezier(P0, P1, P2, s);
            const d = Math.hypot(pt.x - pp.x, pt.y - pp.y);
            if (d < pulseRadius) {
              pulseAlpha = Math.max(pulseAlpha, (1 - d / pulseRadius) * 0.7);
            }
          }
        });

        for (let seg = 0; seg < curveSegments; seg++) {
          const t0 = seg / curveSegments;
          const t1 = (seg + 1) / curveSegments;
          const pt0 = quadraticBezier(P0, P1, P2, t0);
          const pt1 = quadraticBezier(P0, P1, P2, t1);
          const tMid = (t0 + t1) * 0.5;

          // 连线羽化效果：远端（t接近0）透明度从0%渐变到30%，近端保持原有透明度
          const fadeAlpha = tMid < 0.3 ? (tMid / 0.3) * 0.3 : 1;

          const baseAlpha =
            EDGE_ALPHA_MIN +
            (EDGE_ALPHA_MAX - EDGE_ALPHA_MIN) * tMid +
            (pulseAlpha > 0
              ? pulseAlpha * (LINE_PULSE_ALPHA - EDGE_ALPHA_MAX)
              : 0);

          const alpha = baseAlpha * fadeAlpha;

          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.strokeStyle = `rgba(177, 158, 239, ${Math.min(1, alpha)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      particles.forEach((_, pi) => {
        const pt = particlePositions[pi];
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 6);
        grad.addColorStop(0, PARTICLE_COLOR);
        grad.addColorStop(0.5, 'rgba(0, 242, 255, 0.35)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach((node, i) => {
        const jitter = 0.4 * Math.sin(time * 1.5 + i * 0.7) + 0.6;
        ctx.fillStyle = NODE_GLOW;
        ctx.globalAlpha = jitter;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 汇聚点Glow效果：在中心点添加微弱的发光效果，模拟数据能量坍缩
      const centerGlowGrad = ctx.createRadialGradient(
        center.x,
        center.y,
        0,
        center.x,
        center.y,
        25
      );
      centerGlowGrad.addColorStop(0, 'rgba(177, 158, 239, 0.4)');
      centerGlowGrad.addColorStop(0.5, 'rgba(177, 158, 239, 0.15)');
      centerGlowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlowGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 25, 0, Math.PI * 2);
      ctx.fill();

      const rippleStart = rippleStartRef.current;
      if (rippleStart != null) {
        const elapsed = performance.now() - rippleStart;
        if (elapsed < RIPPLE_DURATION_MS) {
          const radius = (elapsed / 1000) * 120;
          const alpha = 1 - elapsed / RIPPLE_DURATION_MS;
          ctx.strokeStyle = `rgba(177, 158, 239, ${alpha * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          rippleStartRef.current = null;
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
      style={{ left: 0, top: 0 }}
      aria-hidden
    />
  );
});

export default PlexusAlpha;
