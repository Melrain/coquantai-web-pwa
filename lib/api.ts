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
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
