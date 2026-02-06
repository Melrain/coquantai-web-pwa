'use client';

import { useContext, useEffect, useState } from 'react';
import { PWAInstallContext } from '@/contexts/PWAInstallContext';
import {
  getSessionStorage,
  PWA_HOME_CONTINUE_BROWSE_KEY,
} from '@/lib/pwa-client';

const NO_PROMPT_HINT_DURATION_MS = 4000;

export default function HomeGate({ children }: { children: React.ReactNode }) {
  const { clientState, deferredPrompt, triggerInstall } =
    useContext(PWAInstallContext);
  const [mounted, setMounted] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [showNoPromptHint, setShowNoPromptHint] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const storage = getSessionStorage();
    if (!storage) {
      setHasCheckedStorage(true);
      return;
    }
    if (storage.getItem(PWA_HOME_CONTINUE_BROWSE_KEY)) {
      setSessionDismissed(true);
    }
    setHasCheckedStorage(true);
  }, []);

  const hasChosenContinueBrowse = sessionDismissed;

  const showGate =
    mounted &&
    hasCheckedStorage &&
    clientState?.mounted === true &&
    clientState.isAndroid === true &&
    clientState.isMobile === true &&
    clientState.isStandalone === false &&
    !hasChosenContinueBrowse;

  const handleInstallClick = async () => {
    await triggerInstall();
    if (!deferredPrompt) {
      setShowNoPromptHint(true);
      setTimeout(() => setShowNoPromptHint(false), NO_PROMPT_HINT_DURATION_MS);
    }
  };

  const handleContinueBrowse = () => {
    getSessionStorage()?.setItem(PWA_HOME_CONTINUE_BROWSE_KEY, '1');
    setSessionDismissed(true);
  };

  if (!showGate) return <>{children}</>;

  return (
    <div
      className='flex min-h-screen flex-col items-center justify-center gap-6 border-t border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950'
      role='dialog'
      aria-label='安装或继续浏览'>
      <p className='text-center text-base text-zinc-600 dark:text-zinc-400'>
        安装到手机，获得更好体验
      </p>
      <div className='flex w-full max-w-xs flex-col gap-3'>
        <button
          type='button'
          onClick={handleInstallClick}
          className='rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
          下载 PWA
        </button>
        <button
          type='button'
          onClick={handleContinueBrowse}
          className='rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900'>
          继续浏览
        </button>
      </div>
      {(showNoPromptHint || !deferredPrompt) && (
        <p
          className={`text-center text-xs text-zinc-500 dark:text-zinc-500 ${
            showNoPromptHint
              ? 'font-medium text-zinc-700 dark:text-zinc-300'
              : ''
          }`}>
          请点击浏览器菜单中的「安装应用」或「添加到主屏幕」
        </p>
      )}
    </div>
  );
}
