'use client';

import {
  type BeforeInstallPromptEvent,
  type ClientState,
  computeClientState,
  getLocalStorage,
  getWindow,
  PWA_ANDROID_FALLBACK_KEY,
  PWA_DISMISS_EXPIRY_DAYS,
  PWA_DISMISS_KEY,
} from '@/lib/pwa-client';
import { createContext, useCallback, useEffect, useState } from 'react';

export type PWAInstallContextValue = {
  clientState: ClientState | null;
  deferredPrompt: BeforeInstallPromptEvent | null;
  triggerInstall: () => Promise<void>;
  updateIosDismiss: () => void;
  updateAndroidFallbackDismiss: () => void;
};

const defaultValue: PWAInstallContextValue = {
  clientState: null,
  deferredPrompt: null,
  triggerInstall: async () => {},
  updateIosDismiss: () => {},
  updateAndroidFallbackDismiss: () => {},
};

export const PWAInstallContext =
  createContext<PWAInstallContextValue>(defaultValue);

export function PWAInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clientState, setClientState] = useState<ClientState | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const next = computeClientState();
    if (next) requestAnimationFrame(() => setClientState(next));
  }, []);

  useEffect(() => {
    if (!clientState?.mounted) return;
    const win = getWindow();
    if (!win) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    win.addEventListener('beforeinstallprompt', handler);
    return () => win.removeEventListener('beforeinstallprompt', handler);
  }, [clientState?.mounted]);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  }, [deferredPrompt]);

  const updateIosDismiss = useCallback(() => {
    const expires = Date.now() + PWA_DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    getLocalStorage()?.setItem(PWA_DISMISS_KEY, JSON.stringify({ expires }));
    setClientState((prev) => (prev ? { ...prev, iosDismissed: true } : null));
  }, []);

  const updateAndroidFallbackDismiss = useCallback(() => {
    const expires = Date.now() + PWA_DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    getLocalStorage()?.setItem(
      PWA_ANDROID_FALLBACK_KEY,
      JSON.stringify({ expires })
    );
    setClientState((prev) =>
      prev ? { ...prev, androidFallbackDismissed: true } : null
    );
  }, []);

  const value: PWAInstallContextValue = {
    clientState,
    deferredPrompt,
    triggerInstall,
    updateIosDismiss,
    updateAndroidFallbackDismiss,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}
