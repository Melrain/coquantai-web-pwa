'use client';

import { useContext, useState } from 'react';
import { PWAInstallContext } from '@/contexts/PWAInstallContext';
import { getWindow } from '@/lib/pwa-client';

export default function InstallPrompt() {
  const {
    clientState,
    deferredPrompt,
    triggerInstall,
    updateIosDismiss,
    updateAndroidFallbackDismiss,
  } = useContext(PWAInstallContext);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    const win = getWindow();
    const href = win?.location.href;
    const clipboard = win?.navigator?.clipboard;
    try {
      if (clipboard && href) {
        await clipboard.writeText(href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch {
      setCopySuccess(false);
    }
  };

  if (!clientState?.mounted || clientState.isStandalone) return null;
  if (clientState.isMobile === false) return null;

  // Android: show install button when we have the prompt event
  if (deferredPrompt) {
    return (
      <div
        className='fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950'
        role='banner'
        aria-label='安装应用'>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          安装到手机，获得更好体验
        </p>
        <button
          type='button'
          onClick={triggerInstall}
          className='rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
          安装 App
        </button>
      </div>
    );
  }

  // iOS + Safari: show add to home screen instructions
  if (clientState.isIOS && clientState.isSafari && !clientState.iosDismissed) {
    return (
      <div
        className='fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950'
        role='banner'
        aria-label='添加到主屏幕'>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          点击 Safari 底部分享按钮
          <span
            role='img'
            aria-label='分享'>
            {' '}
            ⎋{' '}
          </span>
          ，选择「添加到主屏幕」
          <span
            role='img'
            aria-label='添加'>
            {' '}
            ➕
          </span>
        </p>
        <button
          type='button'
          onClick={updateIosDismiss}
          className='mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100'>
          知道了
        </button>
      </div>
    );
  }

  // iOS + non-Safari (e.g. Chrome): ask to open in Safari + copy link
  if (clientState.isIOS && !clientState.isSafari && !clientState.iosDismissed) {
    return (
      <div
        className='fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950'
        role='banner'
        aria-label='使用 Safari 安装'>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          请使用 Safari 打开此页面以安装到主屏幕。
        </p>
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={handleCopyLink}
            className='rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>
            {copySuccess ? '链接已复制，请打开 Safari 粘贴访问' : '复制链接'}
          </button>
          <button
            type='button'
            onClick={updateIosDismiss}
            className='text-sm font-medium text-zinc-900 underline dark:text-zinc-100'>
            知道了
          </button>
        </div>
      </div>
    );
  }

  // Android fallback when beforeinstallprompt did not fire
  if (clientState.isAndroid && !clientState.androidFallbackDismissed) {
    return (
      <div
        className='fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950'
        role='banner'
        aria-label='安装说明'>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          请点击浏览器菜单中的「安装应用」或「添加到主屏幕」
        </p>
        <button
          type='button'
          onClick={updateAndroidFallbackDismiss}
          className='mt-2 text-sm font-medium text-zinc-900 underline dark:text-zinc-100'>
          知道了
        </button>
      </div>
    );
  }

  return null;
}
