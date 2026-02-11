'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';
import {
  getAiQuota,
  getSimTradeBalance,
  getMacroEvents,
  getAnalysisHistory,
  triggerAnalyze,
  getAnalysisStatus,
  type AiQuotaResponse,
  type SimTradeBalanceResponse,
  type MacroEvent,
  type AnalysisHistoryItem,
} from '@/lib/api';
import { SUPPORTED_SYMBOLS, SYMBOL_METADATA } from '@/lib/ai-symbols';
import GradientText from '@/components/GradientText';
import { ChevronDown, ChevronUp, Rocket } from 'lucide-react';

const accentColors = ['#7c3aed', '#a78bfa', '#22d3ee', '#a78bfa'];
const FOMC_ID = '35';
const DEFAULT_MACRO_IDS_MAP: Record<string, string[]> = {
  BTCUSDT: [FOMC_ID, '41', '10331', '10114'],
  ETHUSDT: [FOMC_ID, '40', '10332', '10117'],
  SOLUSDT: [FOMC_ID, '10086', '10333', '10122'],
  XRPUSDT: [FOMC_ID, '10100', '10327', '10123'],
};

const formatDateTime = (date: Date | string | number) => {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

function normalizeAction(action?: string): 'long' | 'short' | 'wait' {
  if (!action) return 'wait';
  const upper = action.toUpperCase();
  if (upper === 'LONG' || upper === 'OPEN_LONG') return 'long';
  if (upper === 'SHORT' || upper === 'OPEN_SHORT') return 'short';
  return 'wait';
}

const cardStyle = {
  borderColor: 'rgba(37, 99, 235, 0.25)',
  background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.04), rgba(37, 99, 235, 0.04))',
  boxShadow: '0 0 24px rgba(37, 99, 235, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [quota, setQuota] = useState<AiQuotaResponse | null>(null);
  const [balance, setBalance] = useState<SimTradeBalanceResponse | null>(null);
  const [symbol, setSymbol] = useState(SUPPORTED_SYMBOLS[0]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSymbolSelect, setShowSymbolSelect] = useState(false);
  const [showAllFactors, setShowAllFactors] = useState(false);
  const [availableMacros, setAvailableMacros] = useState<MacroEvent[]>([]);
  const [macroEventIds, setMacroEventIds] = useState<string[]>(() => {
    return DEFAULT_MACRO_IDS_MAP[SUPPORTED_SYMBOLS[0]] ?? [FOMC_ID];
  });
  const [selectedProvider, setSelectedProvider] = useState<
    'grok' | 'deepseek' | 'qwen'
  >('deepseek');
  const [selectedLanguage, setSelectedLanguage] = useState<
    'Chinese-Simplified' | 'English'
  >('Chinese-Simplified');
  const [historyData, setHistoryData] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadInitial = useCallback(async () => {
    try {
      const [q, b, macros] = await Promise.all([
        getAiQuota().catch(() => null),
        getSimTradeBalance().catch(() => null),
        getMacroEvents().catch(() => []),
      ]);
      setQuota(q ?? null);
      setBalance(b ?? null);
      setAvailableMacros(Array.isArray(macros) ? macros : []);
    } catch {
      // 静默忽略
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    setMacroEventIds(DEFAULT_MACRO_IDS_MAP[symbol] ?? [FOMC_ID]);
  }, [symbol]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAnalysisHistory(symbol, 5, 0);
      setHistoryData(data);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredMacros = availableMacros.filter((macro) => {
    if (!macro.referenceSymbol || macro.referenceSymbol === '') return true;
    return macro.referenceSymbol === symbol;
  });

  const toggleMacroEvent = (id: string) => {
    if (macroEventIds.includes(id)) {
      setMacroEventIds(macroEventIds.filter((item) => item !== id));
    } else {
      setMacroEventIds([...macroEventIds, id]);
    }
  };

  const handleAnalyze = async () => {
    if (loading || isAnalyzing || (quota != null && quota.remaining <= 0))
      return;
    setIsAnalyzing(true);
    setLoading(true);
    try {
      const res = await triggerAnalyze({
        symbol,
        strategy: 'QUANTITATIVE',
        provider: selectedProvider,
        macroEventIds,
        language: selectedLanguage,
      });
      if (!res.success) {
        setIsAnalyzing(false);
        setLoading(false);
        return;
      }
      if (res.quota) setQuota(res.quota);

      const jobId = res.jobId;
      if (!jobId) {
        setIsAnalyzing(false);
        setLoading(false);
        return;
      }

      const pollInterval = 2500;
      const maxAttempts = 120;
      let attempts = 0;

      const poll = async () => {
        if (attempts >= maxAttempts) {
          setIsAnalyzing(false);
          setLoading(false);
          return;
        }
        attempts++;
        try {
          const status = await getAnalysisStatus(jobId);
          if (status.status === 'completed') {
            loadHistory();
            loadInitial();
            setIsAnalyzing(false);
            setLoading(false);
            return;
          }
          if (status.status === 'failed') {
            setIsAnalyzing(false);
            setLoading(false);
            return;
          }
        } catch {
          // 继续轮询
        }
        setTimeout(poll, pollInterval);
      };
      setTimeout(poll, pollInterval);
    } catch (err) {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h1 className='text-2xl font-medium tracking-wide text-slate-800'>
          欢迎，{' '}
          <GradientText
            colors={accentColors}
            animationSpeed={10}
            showBorder={false}>
            {user?.username ?? '用户'}
          </GradientText>
        </h1>
        {user?.email && (
          <p className='mt-1 text-sm text-slate-500'>{user.email}</p>
        )}
      </section>

      {(quota != null || balance != null) && (
        <section className='grid gap-4 sm:grid-cols-2'>
          {quota != null && (
            <div
              className='rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-md'
              style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
              <p className='text-xs text-slate-500'>今日 AI 配额</p>
              <p className='mt-0.5 text-lg font-medium text-slate-800'>
                {quota.remaining} / {quota.limit}
              </p>
            </div>
          )}
          {balance != null && (
            <div
              className='rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-md'
              style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
              <p className='text-xs text-slate-500'>模拟账户权益</p>
              <p className='mt-0.5 text-lg font-medium text-slate-800'>
                {Math.floor(parseFloat(balance.totalEquity) || 0)} USDT
              </p>
            </div>
          )}
        </section>
      )}

      {/* Hero */}
      <section>
        <h2 className='text-xl font-bold tracking-wide text-slate-900'>
          量化决策大脑
        </h2>
        <p className='mt-2 text-sm leading-relaxed text-slate-500'>
          深度整合 Polymarket 预测情绪与币安实时量化指标，为您穿透市场迷雾，提供专业的交易执行逻辑。
        </p>
      </section>

      {/* Config Card */}
      <section
        className='rounded-xl border border-slate-200 bg-white p-5 backdrop-blur-md'
        style={cardStyle}>
        {/* Step 1 */}
        <div className='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className='size-1.5 rounded-full'
              style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
            />
            <span className='text-sm font-medium text-slate-600'>
              分析对象
            </span>
          </div>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setShowSymbolSelect(!showSymbolSelect)}
              disabled={loading || isAnalyzing}
              className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-opacity hover:opacity-90 disabled:opacity-60'>
              {SYMBOL_METADATA[symbol] && (
                <span
                  className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full'
                  style={{
                    backgroundColor: `${SYMBOL_METADATA[symbol].color}30`,
                  }}>
                  <img
                    src={SYMBOL_METADATA[symbol].icon}
                    alt=''
                    width={28}
                    height={28}
                    className='size-7 object-cover'
                  />
                </span>
              )}
              <span>{symbol}</span>
              <ChevronDown className='size-4' />
            </button>
            {showSymbolSelect && (
              <div className='absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 backdrop-blur-md'>
                {SUPPORTED_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    type='button'
                    onClick={() => {
                      setSymbol(s);
                      setShowSymbolSelect(false);
                    }}
                    className='flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-100'>
                    {SYMBOL_METADATA[s] && (
                      <span
                        className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full'
                        style={{
                          backgroundColor: `${SYMBOL_METADATA[s].color}30`,
                        }}>
                        <img
                          src={SYMBOL_METADATA[s].icon}
                          alt=''
                          width={28}
                          height={28}
                          className='size-7 object-cover'
                        />
                      </span>
                    )}
                    <span>{s}</span>
                    <span className='text-xs text-slate-400'>
                      {SYMBOL_METADATA[s]?.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='my-2 h-px bg-slate-200' />

        {/* Step 2 */}
        <div className='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className='size-1.5 rounded-full'
              style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
            />
            <span className='text-sm font-medium text-slate-600'>
              分析因子 (Polymarket)
            </span>
          </div>
          <button
            type='button'
            onClick={() => setShowAllFactors(!showAllFactors)}
            className='flex items-center gap-1 text-sm font-semibold text-blue-600'>
            已选 {macroEventIds.length} 项
            {showAllFactors ? (
              <ChevronUp className='size-4' />
            ) : (
              <ChevronDown className='size-4' />
            )}
          </button>
        </div>
        {showAllFactors && (
          <div className='flex flex-wrap gap-2 py-3'>
            {filteredMacros.map((macro) => {
              const isActive = macroEventIds.includes(macro.id);
              return (
                <button
                  key={macro.id}
                  type='button'
                  onClick={() => toggleMacroEvent(macro.id)}
                  disabled={loading || isAnalyzing}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'border-blue-400/60 bg-blue-100 text-slate-900'
                      : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {macro.label}
                </button>
              );
            })}
          </div>
        )}

        <div className='my-2 h-px bg-slate-200' />

        {/* Step 3 */}
        <div className='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className='size-1.5 rounded-full'
              style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
            />
            <span className='text-sm font-medium text-slate-600'>
              分析引擎
            </span>
          </div>
          <div className='flex gap-2'>
            {(['grok', 'deepseek', 'qwen'] as const).map((p) => {
              const isSelected = selectedProvider === p;
              return (
                <button
                  key={p}
                  type='button'
                  onClick={() => setSelectedProvider(p)}
                  disabled={loading || isAnalyzing}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-blue-400/60 bg-blue-100 text-slate-900'
                      : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className='my-2 h-px bg-slate-200' />

        {/* Step 4 */}
        <div className='flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className='size-1.5 rounded-full'
              style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
            />
            <span className='text-sm font-medium text-slate-600'>
              回复语言
            </span>
          </div>
          <div className='flex gap-2'>
            {[
              { label: '中文', value: 'Chinese-Simplified' as const },
              { label: 'English', value: 'English' as const },
            ].map((l) => {
              const isSelected = selectedLanguage === l.value;
              return (
                <button
                  key={l.value}
                  type='button'
                  onClick={() => setSelectedLanguage(l.value)}
                  disabled={loading || isAnalyzing}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-blue-400/60 bg-blue-100 text-slate-900'
                      : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quota + Analyze */}
        <div className='mt-4 space-y-3'>
          {quota != null && !isAnalyzing && (
            <div className='flex items-center gap-2 text-xs text-slate-500'>
              <span>剩余配额: {quota.remaining} / {quota.limit}</span>
            </div>
          )}
          <button
            type='button'
            onClick={handleAnalyze}
            disabled={loading || isAnalyzing || (quota != null && quota.remaining <= 0)}
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/50 px-6 py-4 text-sm font-bold text-slate-900 transition-all hover:border-blue-500/60 disabled:opacity-50'
            style={{
              background:
                'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.12))',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.15)',
            }}>
            {isAnalyzing ? (
              <>
                <span className='size-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent' />
                分析中...
              </>
            ) : (
              <>
                <Rocket className='size-5' />
                开始分析
              </>
            )}
          </button>
        </div>
      </section>

      {/* History */}
      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-sm font-bold uppercase tracking-wider text-slate-700'>
            历史记录
          </h3>
          {historyLoading && (
            <span className='size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
          )}
        </div>
        {historyData.length > 0 ? (
          <div className='space-y-2'>
            {historyData.slice(0, 5).map((item) => {
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
                  href={`/dashboard/ai-history/${item._id}?symbol=${item.symbol}`}
                  className='block rounded-xl border border-slate-200 bg-white p-4 backdrop-blur-md transition-opacity hover:opacity-90'
                  style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
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
                      <span className='line-clamp-1 text-sm font-medium text-slate-800'>
                        {item.analysisResult?.summary ?? '分析中...'}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-slate-500'>
                      {formatDateTime(item.analyzedAt)}
                      <span className='text-slate-400'>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {historyData.length > 5 && (
              <Link
                href={`/dashboard/ai-history?symbol=${symbol}`}
                className='block py-3 text-center text-sm font-semibold text-blue-600 hover:underline'>
                查看更多
              </Link>
            )}
          </div>
        ) : (
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            暂无历史记录
          </div>
        )}
      </section>
    </div>
  );
}
