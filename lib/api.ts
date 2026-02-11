/**
 * API 客户端：认证相关接口，Token 存取，401 自动 refresh
 */

/** 网络错误（连接失败、超时等），可重试 */
export class NetworkError extends Error {
  readonly name = 'NetworkError';
  constructor(message = '网络连接失败，请检查网络或稍后重试') {
    super(message);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/** 认证错误（401/400 等），密码或凭证问题 */
export class AuthError extends Error {
  readonly name = 'AuthError';
  constructor(message = '用户名或密码错误，请重试') {
    super(message);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    username: string;
    email?: string;
    tier: string;
    emailVerified?: boolean;
  };
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email?: string | null;
  tier: string;
  hasEmail: boolean;
  emailVerified?: boolean;
  isActive: boolean;
  createdAt?: string;
}

function getApiUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  return 'http://localhost:8080';
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function getAccessToken(): string | null {
  return getLocalStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken(): string | null {
  return getLocalStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  const ls = getLocalStorage();
  if (ls) {
    ls.setItem(ACCESS_TOKEN_KEY, accessToken);
    ls.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  const ls = getLocalStorage();
  if (ls) {
    ls.removeItem(ACCESS_TOKEN_KEY);
    ls.removeItem(REFRESH_TOKEN_KEY);
  }
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      const response = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      const data: RefreshResponse = await response.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized | null = null;
export function setOnUnauthorized(fn: OnUnauthorized | null): void {
  onUnauthorized = fn;
}

/** 网络错误是否可重试（连接关闭、超时等） */
function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('abort') ||
      msg.includes('connection') ||
      msg.includes('failed')
    );
  }
  return false;
}

/** 带超时与重试的 fetch，用于登录/注册等易受冷启动影响的接口 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: { retries?: number; timeoutMs?: number }
): Promise<Response> {
  const { retries = 3, timeoutMs = 15000 } = options ?? {};
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    } catch (e) {
      lastError = e;
      clearTimeout(timeout);
      if (i < retries - 1 && isNetworkError(e)) {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        break;
      }
    }
  }
  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new NetworkError('请求超时，请稍后重试');
  }
  if (isNetworkError(lastError)) {
    throw new NetworkError('网络连接失败，请检查网络或稍后重试');
  }
  throw lastError;
}

async function handleErrorResponse(response: Response): Promise<never> {
  const error = await response.json().catch(() => ({ message: '请求失败' }));
  const msg = (error as { message?: string }).message || '请求失败';
  throw new AuthError(msg);
}

export async function authRequest(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init?.headers,
  };
  let response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
          ...init?.headers,
        },
      });
    }
    if (response.status === 401) {
      clearTokens();
      onUnauthorized?.();
      await handleErrorResponse(response);
    }
  }
  return response;
}

export async function register(
  username: string,
  password: string,
  agreed: boolean,
  email?: string
): Promise<AuthResponse> {
  const response = await fetchWithRetry(
    `${getApiUrl()}/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: email?.trim() || undefined,
        password,
        agreed,
      }),
    },
    { retries: 3, timeoutMs: 15000 }
  );
  if (!response.ok) await handleErrorResponse(response);
  const data: AuthResponse = await response.json();
  if (data.access_token && data.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  } else if (data.access_token) {
    getLocalStorage()?.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  return data;
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetchWithRetry(
    `${getApiUrl()}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    },
    { retries: 3, timeoutMs: 15000 }
  );
  if (!response.ok) await handleErrorResponse(response);
  const data: AuthResponse = await response.json();
  if (data.access_token && data.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  } else if (data.access_token) {
    getLocalStorage()?.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  return data;
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    });
  } catch (e) {
    console.warn('logout API failed', e);
  } finally {
    clearTokens();
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  const response = await authRequest(`${getApiUrl()}/auth/profile`);
  if (!response.ok) await handleErrorResponse(response);
  return response.json();
}

/** AI 分析配额 */
export interface AiQuotaResponse {
  used: number;
  remaining: number;
  limit: number;
  resetAt: string;
}

export async function getAiQuota(): Promise<AiQuotaResponse> {
  const response = await authRequest(`${getApiUrl()}/ai-analysis-graph/quota`);
  if (!response.ok) await handleErrorResponse(response);
  return response.json();
}

/** 模拟交易账户余额 */
export interface SimTradeBalanceResponse {
  userId?: string;
  available: string;
  frozen: string;
  totalEquity: string;
  updatedAt?: number;
}

export async function getSimTradeBalance(): Promise<SimTradeBalanceResponse> {
  const response = await authRequest(
    `${getApiUrl()}/sim-trade/account/balance`
  );
  if (!response.ok) await handleErrorResponse(response);
  const json: { success: boolean; data: SimTradeBalanceResponse } =
    await response.json();
  return json.data;
}

/** 模拟交易持仓 */
export interface SimTradePosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entryPrice: string;
  leverage?: number;
  unrealizedPnl?: string;
  markPrice?: string;
  [key: string]: unknown;
}

export async function getSimTradePositions(): Promise<SimTradePosition[]> {
  const response = await authRequest(`${getApiUrl()}/sim-trade/positions`);
  if (!response.ok) await handleErrorResponse(response);
  const json: { success: boolean; data: SimTradePosition[] } =
    await response.json();
  return json.data ?? [];
}

/** 模拟交易活跃订单 */
export interface SimTradeOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: string;
  price?: string;
  stopPrice?: string;
  status: string;
  [key: string]: unknown;
}

export async function getSimTradeActiveOrders(): Promise<SimTradeOrder[]> {
  const response = await authRequest(`${getApiUrl()}/sim-trade/orders/active`);
  if (!response.ok) await handleErrorResponse(response);
  const json: { success: boolean; data: SimTradeOrder[] } =
    await response.json();
  return json.data ?? [];
}

/** 宏观事件 */
export interface MacroEvent {
  id: string;
  label: string;
  type: 'series' | 'event';
  seriesId?: string;
  slug?: string;
  description: string;
  referenceSymbol?: string;
}

export async function getMacroEvents(): Promise<MacroEvent[]> {
  const response = await authRequest(
    `${getApiUrl()}/ai-analysis-graph/macro-events`
  );
  if (!response.ok) await handleErrorResponse(response);
  const json: { success?: boolean; data?: MacroEvent[] } =
    await response.json();
  return json.data ?? [];
}

/** 分析历史项 */
export interface AnalysisHistoryItem {
  _id: string;
  userId: string;
  symbol: string;
  analysisResult: {
    action?: string;
    summary?: string;
    actionDetails?: { direction?: string; entryPrice?: string };
    [key: string]: unknown;
  } | null;
  error?: string;
  provider?: string;
  model?: string;
  analyzedAt: Date | string;
  timestamp: number;
}

export async function getAnalysisHistory(
  symbol: string,
  limit = 20,
  skip = 0
): Promise<AnalysisHistoryItem[]> {
  const params = new URLSearchParams({
    symbol,
    limit: String(limit),
    skip: String(skip),
  });
  const response = await authRequest(
    `${getApiUrl()}/ai-analysis-graph/history?${params}`
  );
  if (!response.ok) await handleErrorResponse(response);
  const json: { success?: boolean; data?: AnalysisHistoryItem[] } =
    await response.json();
  return json.data ?? [];
}

/** 触发分析请求体 */
export interface TriggerAnalyzeBody {
  symbol: string;
  strategy?: 'CONSERVATIVE' | 'QUANTITATIVE' | 'AGGRESSIVE';
  language?: string;
  provider?: string;
  macroEventIds?: string[];
}

/** 触发分析响应 */
export interface TriggerAnalyzeResponse {
  success: boolean;
  jobId?: string;
  sessionId?: string;
  error?: string;
  quota?: AiQuotaResponse;
}

export async function triggerAnalyze(
  body: TriggerAnalyzeBody
): Promise<TriggerAnalyzeResponse> {
  const response = await authRequest(
    `${getApiUrl()}/ai-analysis-graph/analyze`,
    {
      method: 'POST',
      body: JSON.stringify({
        symbol: body.symbol,
        strategy: body.strategy ?? 'QUANTITATIVE',
        language: body.language ?? 'Chinese-Simplified',
        provider: body.provider ?? 'deepseek',
        macroEventIds: body.macroEventIds,
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new AuthError(data.message ?? data.error ?? '分析请求失败');
  }
  return data;
}

/** 分析任务状态 */
export interface AnalysisStatusResponse {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'not_found';
  progress?: number | { progress?: number };
  failedReason?: string;
}

export async function getAnalysisStatus(
  jobId: string
): Promise<AnalysisStatusResponse> {
  const response = await authRequest(
    `${getApiUrl()}/ai-analysis-graph/status/${encodeURIComponent(jobId)}`
  );
  return response.json();
}

/** 最后一次分析结果 */
export interface LastAnalysisResponse {
  success: boolean;
  sessionId?: string;
  data?: unknown;
  error?: string;
}

export async function getLastAnalysis(
  symbol: string
): Promise<LastAnalysisResponse> {
  const response = await authRequest(
    `${getApiUrl()}/ai-analysis-graph/last-analysis?symbol=${encodeURIComponent(symbol)}`
  );
  return response.json();
}

// ========== Arena (AI 交易员竞技场) ==========

export interface ArenaParticipant {
  _id: string;
  userId: string;
  modelId: string;
  provider: string;
  name: string;
  personality: string;
  initialBalance: number;
  status: string;
  lastReflection?: string;
  metadata?: Record<string, unknown>;
}

export interface ArenaStatus {
  status: string;
  activeParticipantsCount: number;
  timestamp: string;
}

export interface ArenaSymbolStatus {
  symbol: string;
  hasPosition: boolean;
  side: 'LONG' | 'SHORT' | null;
  quantity: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnl: number;
  positionValue: number;
  leverage?: number;
  takeProfitPrice?: string | null;
  stopPrice?: string | null;
}

export interface ArenaLiveParticipant {
  participant: {
    _id: string;
    userId: string;
    name: string;
    modelId: string;
    provider: string;
    personality: string;
    lastReflection?: string;
    status: string;
  };
  symbolStatuses: ArenaSymbolStatus[];
  activePositionCount: number;
  totalPositionValue: number;
  totalUnrealizedPnl: number;
  lastDecision: {
    action: string;
    symbol: string;
    reason: string;
    createdAt: string;
  } | null;
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
  };
}

export interface ArenaLiveStatus {
  monitoredSymbols: string[];
  participants: ArenaLiveParticipant[];
}

export interface ArenaRecentActivity {
  _id: string;
  userId: string;
  participantId: string;
  symbol: string;
  participantName: string;
  participantProvider: string;
  reasoning?: string;
  suggestedAction?: { action: string; reason?: string };
  suggestedSignal?: { biasScore: number; confidence: number; summary?: string };
  executedAction?: { type: string; reason?: string };
  pnl?: number;
  status: string;
  createdAt: string;
}

export interface ArenaDecisionLog {
  _id: string;
  userId: string;
  participantId: string;
  symbol: string;
  reasoning?: string;
  suggestedAction?: { action: string; reason?: string; quantity?: string };
  suggestedSignal?: {
    biasScore: number;
    confidence: number;
    summary?: string;
  };
  executedAction?: { type: string; reason?: string };
  pnl?: number;
  status: string;
  analyzedAt: string;
  createdAt: string;
}

export interface ArenaParticipantPerformance {
  participant: ArenaParticipant;
  account: {
    available: string;
    frozen: string;
    totalEquity: string;
    [key: string]: unknown;
  };
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
  };
}

export interface CreateParticipantDto {
  userId: string;
  modelId: string;
  provider: string;
  name: string;
  personality: string;
  initialBalance?: number;
}

/** 公开：获取竞技场概览状态 */
export async function getArenaStatus(): Promise<ArenaStatus> {
  const response = await authRequest(`${getApiUrl()}/arena/status`);
  if (!response.ok) throw new AuthError('获取竞技场状态失败');
  return response.json();
}

/** 公开：获取所有活跃 AI 交易员 */
export async function getArenaParticipants(): Promise<ArenaParticipant[]> {
  const response = await authRequest(`${getApiUrl()}/arena/participants`);
  if (!response.ok) throw new AuthError('获取参与者失败');
  return response.json();
}

/** 公开：获取所有 AI 实时状态 */
export async function getArenaLiveStatus(): Promise<ArenaLiveStatus> {
  const response = await authRequest(`${getApiUrl()}/arena/live-status`);
  if (!response.ok) throw new AuthError('获取实时状态失败');
  return response.json();
}

/** 公开：获取最近操作动态 */
export async function getArenaRecentActivities(
  limit = 10
): Promise<ArenaRecentActivity[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await authRequest(
    `${getApiUrl()}/arena/recent-activities?${params}`
  );
  if (!response.ok) throw new AuthError('获取最近动态失败');
  return response.json();
}

/** 公开：获取交易员性能指标 */
export async function getArenaParticipantPerformance(
  participantId: string
): Promise<ArenaParticipantPerformance> {
  const response = await authRequest(
    `${getApiUrl()}/arena/participants/${encodeURIComponent(participantId)}/performance`
  );
  if (!response.ok) throw new AuthError('获取性能指标失败');
  return response.json();
}

/** 公开：获取交易员决策日志 */
export async function getArenaParticipantLogs(
  participantId: string,
  limit = 20
): Promise<ArenaDecisionLog[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await authRequest(
    `${getApiUrl()}/arena/logs/${encodeURIComponent(participantId)}?${params}`
  );
  if (!response.ok) throw new AuthError('获取决策日志失败');
  return response.json();
}

/** 管理员：创建 AI 交易员 */
export async function createArenaParticipant(
  data: CreateParticipantDto
): Promise<ArenaParticipant> {
  const response = await authRequest(`${getApiUrl()}/arena/participants`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok) throw new AuthError(json.message ?? json.error ?? '创建失败');
  return json;
}

/** 管理员：手动触发决策周期 */
export async function triggerArenaCycle(
  symbol = 'BTCUSDT'
): Promise<{ message: string }> {
  const response = await authRequest(`${getApiUrl()}/arena/trigger`, {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok) throw new AuthError(json.message ?? json.error ?? '触发失败');
  return json;
}

/** 管理员：手动触发复盘周期 */
export async function triggerArenaReflection(): Promise<{ message: string }> {
  const response = await authRequest(
    `${getApiUrl()}/arena/trigger-reflection`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok) throw new AuthError(json.message ?? json.error ?? '触发失败');
  return json;
}

/** 管理员：重置单个交易员 */
export async function resetArenaParticipant(
  participantId: string
): Promise<{ success: boolean; message: string }> {
  const response = await authRequest(
    `${getApiUrl()}/arena/participants/${encodeURIComponent(participantId)}/reset`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok) throw new AuthError(json.message ?? json.error ?? '重置失败');
  return json;
}

/** 管理员：重置所有交易员 */
export async function resetAllArenaParticipants(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await authRequest(`${getApiUrl()}/arena/reset-all`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok)
    throw new AuthError(json.message ?? json.error ?? '重置失败');
  return json;
}

/** 管理员：硬重置竞技场 */
export async function arenaHardReset(): Promise<{
  success: boolean;
  data?: unknown;
  message: string;
}> {
  const response = await authRequest(`${getApiUrl()}/arena/hard-reset`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await response.json();
  if (response.status === 403) throw new AuthError('需要管理员权限');
  if (!response.ok)
    throw new AuthError(json.message ?? json.error ?? '硬重置失败');
  return json;
}
