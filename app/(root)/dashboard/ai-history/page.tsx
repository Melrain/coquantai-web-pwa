'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getAnalysisHistory,
  type AnalysisHistoryItem,
} from '@/lib/api';
import { SUPPORTED_SYMBOLS } from '@/lib/ai-symbols';
import { ArrowLeft } from 'lucide-react';

const formatDateTime = (date: Date | string | number) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function normalizeAction(action?: string): 'long' | 'short' | 'wait' {
  if (!action) return 'wait';
  const upper = action.toUpperCase();
  if (upper === 'LONG' || upper === 'OPEN_LONG') return 'long';
  if (upper === 'SHORT' || upper === 'OPEN_SHORT') return 'short';
  return 'wait';
}

function AiHistoryContent() {
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get('symbol') ?? SUPPORTED_SYMBOLS[0];

  const [symbol, setSymbol] = useState(() => symbolParam);
  const [historyData, setHistoryData] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const loadHistory = useCallback(async (offset = 0, append = false) => {
    setLoading(true);
    try {
      const data = await getAnalysisHistory(symbol, limit, offset);
      if (append) {
        setHistoryData((prev) => [...prev, ...data]);
      } else {
        setHistoryData(data);
      }
      setHasMore(data.length >= limit);
    } catch {
      setHistoryData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setSymbol(symbolParam);
    setSkip(0);
  }, [symbolParam]);

  useEffect(() => {
    loadHistory(0, false);
  }, [loadHistory]);

  const handleLoadMore = () => {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    loadHistory(nextSkip, true);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-4'>
        <Link
          href='/dashboard'
          className='flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800'>
          <ArrowLeft className='size-4' />
          返回
        </Link>
        <h1 className='text-2xl font-medium tracking-wide text-slate-800'>
          分析历史
        </h1>
      </div>

      <div className='flex flex-wrap gap-2'>
        {SUPPORTED_SYMBOLS.map((s) => (
          <button
            key={s}
            type='button'
            onClick={() => {
              setSymbol(s);
              setSkip(0);
              loadHistory(0, false);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              symbol === s
                ? 'border-blue-400/60 bg-blue-100 text-slate-900'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading && historyData.length === 0 ? (
        <div className='flex justify-center py-12'>
          <span className='size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
        </div>
      ) : historyData.length === 0 ? (
        <div
          className='rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500 backdrop-blur-md'
          style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
          暂无历史记录
        </div>
      ) : (
        <div className='space-y-3'>
          {historyData.map((item) => {
            const action = normalizeAction(item.analysisResult?.action);
            const actionText =
              action === 'long' ? '做多' : action === 'short' ? '做空' : '观望';
            const actionColor =
              action === 'long'
                ? 'text-emerald-400'
                : action === 'short'
                  ? 'text-red-400'
                  : 'text-slate-500';

            return (
              <Link
                key={item._id}
                href={`/dashboard/ai-history/${item._id}?symbol=${symbol}`}
                className='block overflow-hidden rounded-xl border border-slate-200 bg-white backdrop-blur-md transition-opacity hover:opacity-90'
                style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
                <div className='flex flex-wrap items-center justify-between gap-2 p-4'>
                  <div className='flex flex-1 items-center gap-2'>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${actionColor}`}
                      style={{
                        backgroundColor:
                          action === 'long'
                            ? 'rgba(52, 211, 153, 0.15)'
                            : action === 'short'
                              ? 'rgba(248, 113, 113, 0.15)'
                              : 'rgba(148,163,184,0.2)',
                      }}>
                      {actionText}
                    </span>
                    <span className='line-clamp-1 flex-1 text-sm font-medium text-slate-800'>
                      {item.analysisResult?.summary ?? item.error ?? '分析中...'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-slate-500'>
                    {formatDateTime(item.analyzedAt)}
                    {item.provider && (
                      <span className='rounded bg-white/10 px-1.5 py-0.5'>
                        {item.provider.toUpperCase()}
                      </span>
                    )}
                    <span className='text-slate-400'>→</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {hasMore && (
            <button
              type='button'
              onClick={handleLoadMore}
              disabled={loading}
              className='w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-opacity hover:bg-white/10 disabled:opacity-50'
              style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center py-12'>
          <span className='size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
        </div>
      }>
      <AiHistoryContent />
    </Suspense>
  );
}
