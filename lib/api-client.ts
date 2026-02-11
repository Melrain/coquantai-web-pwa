const TOKEN_KEY = 'access_token';

export function getBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  return 'http://localhost:8080';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export type OnUnauthorized = () => void;

let onUnauthorizedCallback: OnUnauthorized | null = null;

export function setOnUnauthorized(cb: OnUnauthorized | null): void {
  onUnauthorizedCallback = cb;
}

export interface ApiOptions {
  body?: unknown;
  onUnauthorized?: OnUnauthorized;
}

export async function api(
  method: string,
  path: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { body, onUnauthorized } = options;
  const baseUrl = getBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    const cb = onUnauthorized ?? onUnauthorizedCallback;
    cb?.();
  }

  return res;
}
