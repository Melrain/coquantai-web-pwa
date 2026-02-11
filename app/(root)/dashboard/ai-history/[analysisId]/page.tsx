'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { getAnalysisHistory, type AnalysisHistoryItem } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const cardStyle = {
  borderColor: 'rgba(37, 99, 235, 0.25)',
  background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.04), rgba(37, 99, 235, 0.04))',
};

function normalizeAction(action?: string): 'long' | 'short' | 'wait' {
  if (!action) return 'wait';
  const upper = action.toUpperCase();
  if (upper === 'LONG' || upper === 'OPEN_LONG') return 'long';
  if (upper === 'SHORT' || upper === 'OPEN_SHORT') return 'short';
  return 'wait';
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className='rounded-xl border border-slate-200 bg-white p-4 backdrop-blur-md'
      style={cardStyle}>
      <h3 className='mb-3 text-sm font-bold uppercase tracking-wider text-slate-600'>
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const analysisId = params.analysisId as string;
  const symbolParam = searchParams.get('symbol') ?? '';

  const [item, setItem] = useState<AnalysisHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!analysisId || !symbolParam) {
      setError('缺少参数');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisHistory(symbolParam, 100, 0);
      const found = data.find((i) => i._id === analysisId);
      if (found) {
        setItem(found);
      } else {
        setError('未找到该分析记录');
      }
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [analysisId, symbolParam]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className='flex flex-col gap-6'>
        <Link
          href={`/dashboard/ai-history?symbol=${symbolParam}`}
          className='flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800'>
          <ArrowLeft className='size-4' />
          返回
        </Link>
        <div className='flex justify-center py-12'>
          <span className='size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className='flex flex-col gap-6'>
        <Link
          href='/dashboard/ai-history'
          className='flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800'>
          <ArrowLeft className='size-4' />
          返回
        </Link>
        <div
          className='rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500 backdrop-blur-md'
          style={cardStyle}>
          {error ?? '未找到该分析记录'}
        </div>
      </div>
    );
  }

  const data = item.analysisResult;
  if (!data) {
    return (
      <div className='flex flex-col gap-6'>
        <Link
          href={`/dashboard/ai-history?symbol=${item.symbol}`}
          className='flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800'>
          <ArrowLeft className='size-4' />
          返回
        </Link>
        <div
          className='rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500 backdrop-blur-md'
          style={cardStyle}>
          {item.error ?? '无分析结果'}
        </div>
      </div>
    );
  }

  const action = normalizeAction(data.action);
  const actionText =
    action === 'long' ? '做多' : action === 'short' ? '做空' : '观望';
  const actionColor =
    action === 'long'
      ? 'text-emerald-400'
      : action === 'short'
        ? 'text-red-400'
        : 'text-slate-500';
  const ad = data.actionDetails as {
    direction?: string;
    entryPrice?: string;
    stopLoss?: string;
    takeProfit?: string;
    leverage?: number;
    reason?: string;
  } | undefined;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-4'>
        <Link
          href={`/dashboard/ai-history?symbol=${item.symbol}`}
          className='flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800'>
          <ArrowLeft className='size-4' />
          返回
        </Link>
        <h1 className='text-2xl font-medium tracking-wide text-slate-800'>
          {item.symbol} 分析报告
        </h1>
      </div>

      {/* 交易结论 */}
      <Section title='交易结论'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-bold ${actionColor}`}
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
            {item.provider && (
              <span className='rounded bg-slate-100 px-2 py-0.5 text-xs'>
                {item.provider.toUpperCase()}
              </span>
            )}
          </div>
          {ad && (
            <dl className='grid gap-2 text-sm sm:grid-cols-2'>
              {ad.entryPrice != null && ad.entryPrice !== '' && (
                <>
                  <dt className='text-slate-500'>入场价</dt>
                  <dd className='text-slate-800'>{ad.entryPrice}</dd>
                </>
              )}
              {ad.stopLoss != null && ad.stopLoss !== '' && (
                <>
                  <dt className='text-slate-500'>止损</dt>
                  <dd className='text-slate-800'>{ad.stopLoss}</dd>
                </>
              )}
              {ad.takeProfit != null && ad.takeProfit !== '' && (
                <>
                  <dt className='text-slate-500'>止盈</dt>
                  <dd className='text-slate-800'>{ad.takeProfit}</dd>
                </>
              )}
              {ad.leverage != null && ad.leverage > 0 && (
                <>
                  <dt className='text-slate-500'>杠杆</dt>
                  <dd className='text-slate-800'>{ad.leverage}x</dd>
                </>
              )}
            </dl>
          )}
          {ad?.reason && (
            <p className='text-sm text-slate-600'>{ad.reason}</p>
          )}
        </div>
      </Section>

      {/* 摘要 */}
      {data.summary && (
        <Section title='摘要'>
          <p className='whitespace-pre-wrap text-sm leading-relaxed text-slate-700'>
            {data.summary}
          </p>
        </Section>
      )}

      {/* 市场分析 */}
      {(data as { marketAnalysis?: { trend?: string; reason?: string; confidence?: number; riskScore?: number; indicators?: Record<string, string> } }).marketAnalysis && (
        <Section title='市场分析'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { marketAnalysis: { trend?: string } }).marketAnalysis.trend && (
              <p>
                趋势:{' '}
                {(data as { marketAnalysis: { trend: string } }).marketAnalysis.trend}
              </p>
            )}
            {(data as { marketAnalysis: { reason?: string } }).marketAnalysis.reason && (
              <p>
                原因:{' '}
                {(data as { marketAnalysis: { reason: string } }).marketAnalysis.reason}
              </p>
            )}
            {(data as { marketAnalysis: { confidence?: number } }).marketAnalysis.confidence != null && (
              <p>
                置信度:{' '}
                {(data as { marketAnalysis: { confidence: number } }).marketAnalysis.confidence}%
              </p>
            )}
            {(data as { marketAnalysis: { riskScore?: number } }).marketAnalysis.riskScore != null && (
              <p>
                风险分:{' '}
                {(data as { marketAnalysis: { riskScore: number } }).marketAnalysis.riskScore}
              </p>
            )}
            {(data as { marketAnalysis: { indicators?: Record<string, string> } }).marketAnalysis.indicators && (
              <div className='mt-2 space-y-1'>
                {Object.entries(
                  (data as { marketAnalysis: { indicators: Record<string, string> } }).marketAnalysis.indicators
                ).map(([k, v]) => (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 新闻摘要 */}
      {(data as { newsSummary?: { importantNews?: string[]; marketSentiment?: string; impactAssessment?: string } }).newsSummary && (
        <Section title='新闻摘要'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { newsSummary: { marketSentiment?: string } }).newsSummary.marketSentiment && (
              <p>
                市场情绪:{' '}
                {(data as { newsSummary: { marketSentiment: string } }).newsSummary.marketSentiment}
              </p>
            )}
            {(data as { newsSummary: { impactAssessment?: string } }).newsSummary.impactAssessment && (
              <p>
                影响评估:{' '}
                {(data as { newsSummary: { impactAssessment: string } }).newsSummary.impactAssessment}
              </p>
            )}
            {(data as { newsSummary: { importantNews?: string[] } }).newsSummary.importantNews?.length ? (
              <ul className='list-inside list-disc space-y-1'>
                {(data as { newsSummary: { importantNews: string[] } }).newsSummary.importantNews.map(
                  (n, i) => (
                    <li key={i}>{n}</li>
                  )
                )}
              </ul>
            ) : null}
          </div>
        </Section>
      )}

      {/* 预测市场 */}
      {(data as { predictionMarket?: { sentiment?: string; consensus?: string; keyPredictions?: string[]; impact?: string } }).predictionMarket && (
        <Section title='预测市场'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { predictionMarket: { sentiment?: string } }).predictionMarket.sentiment && (
              <p>
                情绪:{' '}
                {(data as { predictionMarket: { sentiment: string } }).predictionMarket.sentiment}
              </p>
            )}
            {(data as { predictionMarket: { consensus?: string } }).predictionMarket.consensus && (
              <p>
                共识:{' '}
                {(data as { predictionMarket: { consensus: string } }).predictionMarket.consensus}
              </p>
            )}
            {(data as { predictionMarket: { impact?: string } }).predictionMarket.impact && (
              <p>
                影响:{' '}
                {(data as { predictionMarket: { impact: string } }).predictionMarket.impact}
              </p>
            )}
            {(data as { predictionMarket: { keyPredictions?: string[] } }).predictionMarket.keyPredictions?.length ? (
              <ul className='list-inside list-disc space-y-1'>
                {(data as { predictionMarket: { keyPredictions: string[] } }).predictionMarket.keyPredictions.map(
                  (p, i) => (
                    <li key={i}>{p}</li>
                  )
                )}
              </ul>
            ) : null}
          </div>
        </Section>
      )}

      {/* 社会情绪 */}
      {(data as { socialSentiment?: { index?: number; hotKeywords?: string[]; summary?: string } }).socialSentiment && (
        <Section title='社会情绪'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { socialSentiment: { index?: number } }).socialSentiment.index != null && (
              <p>
                指数:{' '}
                {(data as { socialSentiment: { index: number } }).socialSentiment.index}
              </p>
            )}
            {(data as { socialSentiment: { summary?: string } }).socialSentiment.summary && (
              <p>
                {(data as { socialSentiment: { summary: string } }).socialSentiment.summary}
              </p>
            )}
            {(data as { socialSentiment: { hotKeywords?: string[] } }).socialSentiment.hotKeywords?.length ? (
              <p>
                热词:{' '}
                {(data as { socialSentiment: { hotKeywords: string[] } }).socialSentiment.hotKeywords.join(', ')}
              </p>
            ) : null}
          </div>
        </Section>
      )}

      {/* 流动性分析 */}
      {(data as { liquidityAnalysis?: { sentimentTrap?: string; riskLevel?: string; whaleVsRetail?: string; actionReference?: string } }).liquidityAnalysis && (
        <Section title='流动性分析'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { liquidityAnalysis: { sentimentTrap?: string } }).liquidityAnalysis.sentimentTrap && (
              <p>
                情绪陷阱:{' '}
                {(data as { liquidityAnalysis: { sentimentTrap: string } }).liquidityAnalysis.sentimentTrap}
              </p>
            )}
            {(data as { liquidityAnalysis: { riskLevel?: string } }).liquidityAnalysis.riskLevel && (
              <p>
                风险等级:{' '}
                {(data as { liquidityAnalysis: { riskLevel: string } }).liquidityAnalysis.riskLevel}
              </p>
            )}
            {(data as { liquidityAnalysis: { whaleVsRetail?: string } }).liquidityAnalysis.whaleVsRetail && (
              <p>
                鲸鱼 vs 散户:{' '}
                {(data as { liquidityAnalysis: { whaleVsRetail: string } }).liquidityAnalysis.whaleVsRetail}
              </p>
            )}
            {(data as { liquidityAnalysis: { actionReference?: string } }).liquidityAnalysis.actionReference && (
              <p>
                操作参考:{' '}
                {(data as { liquidityAnalysis: { actionReference: string } }).liquidityAnalysis.actionReference}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* 关键价位 */}
      {(data as { keyLevels?: { support?: string[]; resistance?: string[] } }).keyLevels && (
        <Section title='关键价位'>
          <div className='grid gap-3 text-sm sm:grid-cols-2'>
            {(data as { keyLevels: { support?: string[] } }).keyLevels.support?.length ? (
              <div>
                <p className='mb-1 font-medium text-slate-600'>支撑</p>
                <p className='text-slate-800'>
                  {(data as { keyLevels: { support: string[] } }).keyLevels.support.join(', ')}
                </p>
              </div>
            ) : null}
            {(data as { keyLevels: { resistance?: string[] } }).keyLevels.resistance?.length ? (
              <div>
                <p className='mb-1 font-medium text-slate-600'>阻力</p>
                <p className='text-slate-800'>
                  {(data as { keyLevels: { resistance: string[] } }).keyLevels.resistance.join(', ')}
                </p>
              </div>
            ) : null}
          </div>
        </Section>
      )}

      {/* 短期策略 */}
      {(data as { shortTermStrategy?: { trend?: string; analysis?: string; suggestion?: string } }).shortTermStrategy && (
        <Section title='短期策略'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { shortTermStrategy: { trend?: string } }).shortTermStrategy.trend && (
              <p>
                趋势:{' '}
                {(data as { shortTermStrategy: { trend: string } }).shortTermStrategy.trend}
              </p>
            )}
            {(data as { shortTermStrategy: { analysis?: string } }).shortTermStrategy.analysis && (
              <p>
                {(data as { shortTermStrategy: { analysis: string } }).shortTermStrategy.analysis}
              </p>
            )}
            {(data as { shortTermStrategy: { suggestion?: string } }).shortTermStrategy.suggestion && (
              <p>
                建议:{' '}
                {(data as { shortTermStrategy: { suggestion: string } }).shortTermStrategy.suggestion}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* 新闻分析 (Tavily) */}
      {(data as { newsAnalysis?: { summary?: string; catalyst?: string; impact?: string } }).newsAnalysis && (
        <Section title='新闻分析'>
          <div className='space-y-2 text-sm text-slate-700'>
            {(data as { newsAnalysis: { summary?: string } }).newsAnalysis.summary && (
              <p>{(data as { newsAnalysis: { summary: string } }).newsAnalysis.summary}</p>
            )}
            {(data as { newsAnalysis: { catalyst?: string } }).newsAnalysis.catalyst && (
              <p>
                催化剂:{' '}
                {(data as { newsAnalysis: { catalyst: string } }).newsAnalysis.catalyst}
              </p>
            )}
            {(data as { newsAnalysis: { impact?: string } }).newsAnalysis.impact && (
              <p>
                影响:{' '}
                {(data as { newsAnalysis: { impact: string } }).newsAnalysis.impact}
              </p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
