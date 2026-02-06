/** Browser window shape so we don't rely on DOM lib types (e.g. in mixed worker/dom setups). */
export interface BrowserWin {
  matchMedia(query: string): { matches: boolean };
  navigator: {
    userAgent: string;
    standalone?: boolean;
    clipboard?: { writeText(text: string): Promise<void> };
  };
  location: { href: string };
  addEventListener(type: string, handler: (e: Event) => void): void;
  removeEventListener(type: string, handler: (e: Event) => void): void;
  localStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
  sessionStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
}

export function getWindow(): BrowserWin | undefined {
  return typeof globalThis !== 'undefined' && 'window' in globalThis
    ? (globalThis as unknown as { window: BrowserWin }).window
    : undefined;
}

export function getLocalStorage(): BrowserWin['localStorage'] {
  return getWindow()?.localStorage;
}

export function getSessionStorage(): BrowserWin['sessionStorage'] {
  return getWindow()?.sessionStorage;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWA_DISMISS_KEY = 'pwa-install-dismissed';
export const PWA_ANDROID_FALLBACK_KEY = 'pwa-android-fallback-dismissed';
export const PWA_HOME_CONTINUE_BROWSE_KEY = 'pwa-home-continue-browse';
export const PWA_DISMISS_EXPIRY_DAYS = 7;

export type ClientState = {
  isStandalone: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  iosDismissed: boolean;
  androidFallbackDismissed: boolean;
  mounted: true;
};

export function computeClientState(): ClientState | null {
  const win = getWindow();
  const storage = getLocalStorage();
  if (!win) return null;

  const standalone =
    win.matchMedia('(display-mode: standalone)').matches ||
    (win.navigator as { standalone?: boolean }).standalone === true;

  const ua = win.navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) &&
    !(win as unknown as { MSStream?: boolean }).MSStream;
  const safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  const isAndroid = /Android/.test(ua);
  const mobile =
    win.matchMedia('(max-width: 768px)').matches ||
    win.matchMedia('(pointer: coarse)').matches;

  let iosDismissed = false;
  if (storage) {
    const raw = storage.getItem(PWA_DISMISS_KEY);
    if (raw) {
      try {
        const { expires } = JSON.parse(raw) as { expires?: number };
        iosDismissed = expires ? Date.now() < expires : true;
      } catch {
        iosDismissed = false;
      }
    }
  }

  let androidFallbackDismissed = false;
  if (storage) {
    const androidRaw = storage.getItem(PWA_ANDROID_FALLBACK_KEY);
    if (androidRaw) {
      try {
        const { expires } = JSON.parse(androidRaw) as { expires?: number };
        androidFallbackDismissed = expires ? Date.now() < expires : true;
      } catch {
        androidFallbackDismissed = false;
      }
    }
  }

  return {
    isStandalone: standalone,
    isIOS: ios,
    isSafari: safari,
    isAndroid,
    isMobile: mobile,
    iosDismissed,
    androidFallbackDismissed,
    mounted: true,
  };
}
