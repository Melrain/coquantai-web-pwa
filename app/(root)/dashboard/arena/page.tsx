'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getArenaStatus,
  getArenaLiveStatus,
  getArenaRecentActivities,
  getArenaParticipantPerformance,
  getArenaParticipantLogs,
  type ArenaLiveStatus,
  type ArenaRecentActivity,
  type ArenaStatus,
  type ArenaLiveParticipant,
} from '@/lib/api';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const MONITORED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const CARD_STYLE = {
  borderColor: 'rgba(37, 99, 235, 0.25)',
  background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.04), rgba(37, 99, 235, 0.04))',
  boxShadow: '0 0 24px rgba(37, 99, 235, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
};

function formatDateTime(date: Date | string) {
  const d = new Date(date);
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${m}-${day} ${h}:${min}`;
}

function normalizeAction(action?: string): 'long' | 'short' | 'wait' {
  if (!action) return 'wait';
  const upper = action.toUpperCase();
  if (upper.includes('LONG') || upper.includes('BUY')) return 'long';
  if (upper.includes('SHORT') || upper.includes('SELL')) return 'short';
  return 'wait';
}

export default function ArenaPage() {
  const [status, setStatus] = useState<ArenaStatus | null>(null);
  const [liveStatus, setLiveStatus] = useState<ArenaLiveStatus | null>(null);
  const [activities, setActivities] = useState<ArenaRecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, ls, act] = await Promise.all([
        getArenaStatus(),
        getArenaLiveStatus(),
        getArenaRecentActivities(10),
      ]);
      setStatus(s);
      setLiveStatus(ls);
      setActivities(act);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-slate-500'>加载中...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h1 className='text-2xl font-medium tracking-wide text-slate-800'>
          AI 交易员竞技场
        </h1>
        <button
          type='button'
          onClick={() => load()}
          disabled={loading}
          className='flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-opacity hover:opacity-90 disabled:opacity-50'
          style={{ borderColor: 'rgba(37, 99, 235, 0.4)' }}>
          <RefreshCw className='size-4' />
          刷新
        </button>
      </div>

      {error && (
        <div className='rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300'>
          {error}
        </div>
      )}

      {/* 概览 */}
      {status && (
        <section
          className='rounded-xl border border-slate-200 bg-white p-5 backdrop-blur-md'
          style={CARD_STYLE}>
          <h2 className='mb-4 text-lg font-medium text-slate-800'>竞技场概览</h2>
          <div className='flex flex-wrap gap-4'>
            <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='text-xs text-slate-500'>状态</p>
              <p className='mt-0.5 font-medium text-slate-800'>{status.status}</p>
            </div>
            <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='text-xs text-slate-500'>活跃交易员</p>
              <p className='mt-0.5 font-medium text-slate-800'>
                {status.activeParticipantsCount}
              </p>
            </div>
            <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='text-xs text-slate-500'>监控币种</p>
              <p className='mt-0.5 font-medium text-slate-800'>
                {MONITORED_SYMBOLS.join(', ')}
              </p>
            </div>
            <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='text-xs text-slate-500'>更新时间</p>
              <p className='mt-0.5 text-sm font-medium text-slate-800'>
                {formatDateTime(status.timestamp)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* AI 交易员实时看板 */}
      {liveStatus && liveStatus.participants.length > 0 && (
        <section>
          <h2 className='mb-4 text-lg font-medium text-slate-800'>
            AI 交易员实时看板
          </h2>
          <div className='space-y-4'>
            {liveStatus.participants.map((p) => (
              <ParticipantCard
                key={p.participant._id}
                data={p}
                expanded={expandedId === p.participant._id}
                onExpand={() =>
                  setExpandedId((id) =>
                    id === p.participant._id ? null : p.participant._id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {liveStatus && liveStatus.participants.length === 0 && (
        <div
          className='rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500 backdrop-blur-md'
          style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
          暂无活跃交易员
        </div>
      )}

      {/* 最近操作动态 */}
      <section>
        <h2 className='mb-4 text-lg font-medium text-slate-800'>最近操作动态</h2>
        {activities.length > 0 ? (
          <div className='space-y-2'>
            {activities.slice(0, 10).map((a) => {
              const action = normalizeAction(
                a.executedAction?.type ?? a.suggestedAction?.action ?? a.suggestedSignal?.summary
              );
              const actionText =
                action === 'long'
                  ? '做多'
                  : action === 'short'
                    ? '做空'
                    : '观望';
              const actionColor =
                action === 'long'
                  ? 'text-emerald-400'
                  : action === 'short'
                    ? 'text-red-400'
                    : 'text-slate-500';
              return (
                <div
                  key={a._id}
                  className='rounded-xl border border-slate-200 bg-white p-4 backdrop-blur-md'
                  style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${actionColor}`}
                        style={{
                          backgroundColor:
                            action === 'long'
                              ? 'rgba(52, 211, 153, 0.15)'
                              : action === 'short'
                                ? 'rgba(248, 113, 113, 0.15)'
                                : 'rgba(255,255,255,0.1)',
                        }}>
                        {actionText}
                      </span>
                      <span className='font-medium text-slate-800'>
                        {a.participantName}
                      </span>
                      <span className='text-slate-500'>{a.symbol}</span>
                    </div>
                    <span className='text-xs text-slate-400'>
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                  <p className='mt-2 line-clamp-2 text-sm text-slate-600'>
                    {a.reasoning ??
                      a.suggestedSignal?.summary ??
                      a.suggestedAction?.reason ??
                      a.executedAction?.reason ??
                      '-'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500 backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            暂无操作动态
          </div>
        )}
      </section>
    </div>
  );
}

function ParticipantCard({
  data,
  expanded,
  onExpand,
}: {
  data: ArenaLiveParticipant;
  expanded: boolean;
  onExpand: () => void;
}) {
  const { participant, symbolStatuses, totalPositionValue, totalUnrealizedPnl, lastDecision, stats } = data;
  const [perf, setPerf] = useState<Awaited<ReturnType<typeof getArenaParticipantPerformance>> | null>(null);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof getArenaParticipantLogs>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setDetailLoading(true);
    Promise.all([
      getArenaParticipantPerformance(participant._id),
      getArenaParticipantLogs(participant._id, 10),
    ])
      .then(([p, l]) => {
        setPerf(p);
        setLogs(l);
      })
      .finally(() => setDetailLoading(false));
  }, [expanded, participant._id]);

  const pnlColor = totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className='rounded-xl border border-slate-200 bg-white backdrop-blur-md'
      style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
      <div
        role='button'
        tabIndex={0}
        onClick={onExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand();
          }
        }}
        className='flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left'>
        <div className='flex flex-1 flex-wrap items-center gap-4'>
          <div>
            <h3 className='font-medium text-slate-900'>{participant.name}</h3>
            <p className='text-xs text-slate-500'>{participant.provider}</p>
          </div>
          <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
            <p className='text-xs text-slate-500'>持仓价值</p>
            <p className='text-sm font-medium text-slate-800'>
              {Math.floor(totalPositionValue).toLocaleString()} USDT
            </p>
          </div>
          <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
            <p className='text-xs text-slate-500'>浮动盈亏</p>
            <p className={`text-sm font-medium ${pnlColor}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}
              {totalUnrealizedPnl.toFixed(2)} USDT
            </p>
          </div>
          <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
            <p className='text-xs text-slate-500'>胜率</p>
            <p className='text-sm font-medium text-slate-800'>
              {stats.winRate.toFixed(1)}%
            </p>
          </div>
          {lastDecision && (
            <div className='max-w-[200px]'>
              <p className='text-xs text-slate-500'>最近决策</p>
              <p className='truncate text-sm text-slate-700'>
                {lastDecision.action} | {lastDecision.reason || '-'}
              </p>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {expanded ? (
            <ChevronUp className='size-5 text-slate-500' />
          ) : (
            <ChevronDown className='size-5 text-slate-500' />
          )}
        </div>
      </div>

      {expanded && (
        <div className='border-t border-slate-200 p-4'>
          {detailLoading ? (
            <p className='py-4 text-center text-slate-500'>加载详情...</p>
          ) : (
            <div className='space-y-4'>
              {perf && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-slate-700'>账户与统计</h4>
                  <div className='flex flex-wrap gap-3'>
                    <div className='rounded border border-slate-200 px-3 py-2'>
                      <span className='text-xs text-slate-500'>可用</span>{' '}
                      <span className='text-slate-800'>
                        {Math.floor(parseFloat(perf.account.available)).toLocaleString()}{' '}
                        USDT
                      </span>
                    </div>
                    <div className='rounded border border-slate-200 px-3 py-2'>
                      <span className='text-xs text-slate-500'>总权益</span>{' '}
                      <span className='text-slate-800'>
                        {Math.floor(parseFloat(perf.account.totalEquity)).toLocaleString()}{' '}
                        USDT
                      </span>
                    </div>
                    <div className='rounded border border-slate-200 px-3 py-2'>
                      <span className='text-xs text-slate-500'>交易数</span>{' '}
                      <span className='text-slate-800'>{perf.stats.totalTrades}</span>
                    </div>
                    <div className='rounded border border-slate-200 px-3 py-2'>
                      <span className='text-xs text-slate-500'>总盈亏</span>{' '}
                      <span
                        className={
                          perf.stats.totalPnl >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }>
                        {perf.stats.totalPnl >= 0 ? '+' : ''}
                        {perf.stats.totalPnl.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className='mb-2 text-sm font-medium text-slate-700'>各币种持仓</h4>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-sm'>
                    <thead>
                      <tr className='border-b border-slate-200'>
                        <th className='px-3 py-2 text-slate-600'>币种</th>
                        <th className='px-3 py-2 text-slate-600'>方向</th>
                        <th className='px-3 py-2 text-slate-600'>数量</th>
                        <th className='px-3 py-2 text-slate-600'>开仓价</th>
                        <th className='px-3 py-2 text-slate-600'>当前价</th>
                        <th className='px-3 py-2 text-slate-600'>浮动盈亏</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolStatuses.map((s) => (
                        <tr key={s.symbol} className='border-b border-slate-100'>
                          <td className='px-3 py-2 text-slate-800'>{s.symbol}</td>
                          <td className='px-3 py-2 text-slate-800'>
                            {s.hasPosition ? s.side : '-'}
                          </td>
                          <td className='px-3 py-2 text-slate-800'>{s.quantity}</td>
                          <td className='px-3 py-2 text-slate-800'>
                            {s.entryPrice}
                          </td>
                          <td className='px-3 py-2 text-slate-800'>
                            {s.currentPrice}
                          </td>
                          <td
                            className={`px-3 py-2 ${
                              s.unrealizedPnl >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}>
                            {s.unrealizedPnl >= 0 ? '+' : ''}
                            {s.unrealizedPnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {logs && logs.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-slate-700'>
                    决策日志
                  </h4>
                  <div className='space-y-2 max-h-60 overflow-y-auto'>
                    {logs.map((log) => (
                      <div
                        key={log._id}
                        className='rounded border border-slate-200 bg-slate-50 p-3 text-sm'>
                        <div className='flex items-center justify-between gap-2'>
                          <span className='text-slate-600'>{log.symbol}</span>
                          <span className='text-xs text-slate-400'>
                            {formatDateTime(log.analyzedAt)}
                          </span>
                        </div>
                        <p className='mt-1 line-clamp-2 text-slate-700'>
                          {log.reasoning ?? log.suggestedAction?.reason ?? '-'}
                        </p>
                        <p className='mt-1 text-xs text-slate-500'>
                          动作:{' '}
                          {log.executedAction?.type ??
                            log.suggestedAction?.action ??
                            log.suggestedSignal
                              ? `SIGNAL(${log.suggestedSignal?.biasScore},${log.suggestedSignal?.confidence})`
                              : '-'}
                          {log.pnl != null && (
                            <span
                              className={
                                log.pnl >= 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }>
                              {' '}
                              PnL: {log.pnl >= 0 ? '+' : ''}
                              {log.pnl.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
