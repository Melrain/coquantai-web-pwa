'use client';

import { useEffect, useState } from 'react';
import { getAiQuota } from '@/lib/api';
import type { AiQuotaResponse } from '@/lib/api';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT'];

export default function AiAnalysisPage() {
  const [quota, setQuota] = useState<AiQuotaResponse | null>(null);
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAiQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  const handleAnalyze = () => {
    setLoading(true);
    // 占位：后续对接 POST /ai-analysis-graph/analyze
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-medium tracking-wide text-white/90'>
        AI 分析
      </h1>

      {quota != null && (
        <div
          className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
          style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
          <p className='text-xs text-white/60'>今日剩余配额</p>
          <p className='mt-0.5 text-lg font-medium text-white/90'>
            {quota.remaining} / {quota.limit}
          </p>
          {quota.resetAt && (
            <p className='mt-1 text-xs text-white/55'>
              重置于 {new Date(quota.resetAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <section
        className='rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-md'
        style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
        <label className='mb-2 block text-sm text-white/70'>选择币种</label>
        <select
          value={symbol}
          onChange={(e) => {
            const v = (e.target as unknown as { value: string }).value;
            setSymbol(v);
          }}
          className='w-full max-w-xs rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white/90 focus:border-purple-400/50 focus:outline-none'>
          {SYMBOLS.map((s) => (
            <option
              key={s}
              value={s}
              className='bg-slate-900'>
              {s}
            </option>
          ))}
        </select>
        <button
          type='button'
          onClick={handleAnalyze}
          disabled={loading || (quota != null && quota.remaining <= 0)}
          className='mt-4 rounded-xl border border-purple-400/40 px-6 py-3 text-sm font-medium text-white/90 transition-all hover:border-purple-400/60 disabled:opacity-50'
          style={{
            background:
              'linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(34, 211, 238, 0.15))',
          }}>
          {loading ? '分析中...' : '触发分析'}
        </button>
        <p className='mt-3 text-xs text-white/55'>分析功能即将接入，敬请期待</p>
      </section>
    </div>
  );
}
