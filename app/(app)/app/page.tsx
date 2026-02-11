'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';
import {
  getAiQuota,
  getSimTradeBalance,
  type AiQuotaResponse,
  type SimTradeBalanceResponse,
} from '@/lib/api';
import { BarChart3, Cog, Sparkles } from 'lucide-react';
import GradientText from '@/components/GradientText';

const accentColors = ['#7c3aed', '#a78bfa', '#22d3ee', '#a78bfa'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [quota, setQuota] = useState<AiQuotaResponse | null>(null);
  const [balance, setBalance] = useState<SimTradeBalanceResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [q, b] = await Promise.all([
          getAiQuota().catch(() => null),
          getSimTradeBalance().catch(() => null),
        ]);
        setQuota(q ?? null);
        setBalance(b ?? null);
      } catch {
        // 静默忽略
      }
    };
    load();
  }, []);

  const navCards = [
    {
      href: '/app/ai',
      label: 'AI 分析',
      icon: Sparkles,
      desc: '今日 AI 分析配额',
      extra: quota != null ? `${quota.remaining}/${quota.limit}` : undefined,
    },
    {
      href: '/app/sim-trade',
      label: '模拟交易',
      icon: BarChart3,
      desc: '账户余额',
      extra: balance ? `USDT ${balance.totalEquity}` : undefined,
    },
    {
      href: '/app/settings',
      label: '设置',
      icon: Cog,
      desc: '账号与偏好',
    },
  ];

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h1 className='text-2xl font-medium tracking-wide text-white/90'>
          欢迎，{' '}
          <GradientText
            colors={accentColors}
            animationSpeed={10}
            showBorder={false}>
            {user?.username ?? '用户'}
          </GradientText>
        </h1>
        {user?.email && (
          <p className='mt-1 text-sm text-white/65'>{user.email}</p>
        )}
      </section>

      {(quota != null || balance != null) && (
        <section className='flex flex-wrap gap-4'>
          {quota != null && (
            <div
              className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
              style={{
                borderColor: 'rgba(124, 58, 237, 0.3)',
              }}>
              <p className='text-xs text-white/60'>今日 AI 配额</p>
              <p className='mt-0.5 text-lg font-medium text-white/90'>
                {quota.remaining} / {quota.limit}
              </p>
            </div>
          )}
          {balance != null && (
            <div
              className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
              style={{
                borderColor: 'rgba(124, 58, 237, 0.3)',
              }}>
              <p className='text-xs text-white/60'>模拟账户权益</p>
              <p className='mt-0.5 text-lg font-medium text-white/90'>
                {balance.totalEquity} USDT
              </p>
            </div>
          )}
        </section>
      )}

      <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {navCards.map(({ href, label, icon: Icon, desc, extra }) => (
          <Link
            key={href}
            href={href}
            className='block rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-md transition-opacity hover:opacity-90'
            style={{
              borderColor: 'rgba(124, 58, 237, 0.3)',
              boxShadow:
                '0 0 24px rgba(124, 58, 237, 0.1), 0 0 48px rgba(34, 211, 238, 0.05)',
              background:
                'linear-gradient(to bottom, rgba(124, 58, 237, 0.05), rgba(34, 211, 238, 0.05))',
            }}>
            <Icon className='mb-3 size-8 text-white/80' />
            <h2 className='text-lg font-medium text-white/90'>{label}</h2>
            <p className='mt-1 text-sm text-white/65'>{desc}</p>
            {extra != null && (
              <p className='mt-2 text-sm font-medium text-white/80'>{extra}</p>
            )}
          </Link>
        ))}
      </section>
    </div>
  );
}
