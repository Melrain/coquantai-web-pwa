'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HomeWithGalaxy from '@/components/HomeWithGalaxy';
import { useAuthStore } from '@/stores';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace('/app');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    try {
      await login(username.trim(), password);
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户名或密码错误，请重试');
    }
  };

  return (
    <HomeWithGalaxy>
      <div
        className='relative flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8'
        style={{
          paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 3.5rem))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}>
        <div className='w-full max-w-sm'>
          <h2 className='text-center text-xl font-medium tracking-[0.2em] text-white/90'>
            登录
          </h2>
          <form
            onSubmit={handleSubmit}
            className='mt-8 flex flex-col gap-4'>
            <div>
              <label
                htmlFor='username'
                className='mb-1.5 block text-sm text-white/70'>
                用户名
              </label>
              <input
                id='username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete='username'
                disabled={isLoading}
                className='w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white/90 placeholder-white/40 backdrop-blur-sm focus:border-purple-400/50 focus:outline-none disabled:opacity-60'
                placeholder='请输入用户名'
              />
            </div>
            <div>
              <label
                htmlFor='password'
                className='mb-1.5 block text-sm text-white/70'>
                密码
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='current-password'
                disabled={isLoading}
                className='w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white/90 placeholder-white/40 backdrop-blur-sm focus:border-purple-400/50 focus:outline-none disabled:opacity-60'
                placeholder='请输入密码'
              />
            </div>
            {error && (
              <p
                className='text-center text-sm text-red-400'
                role='alert'>
                {error}
              </p>
            )}
            <button
              type='submit'
              disabled={isLoading}
              className='mt-2 rounded-xl border border-purple-400/40 px-6 py-3 text-sm font-medium text-white/90 transition-all hover:border-purple-400/60 hover:shadow-[0_0_16px_rgba(124,58,237,0.25)] disabled:opacity-60'
              style={{
                background:
                  'linear-gradient(to right, rgba(124, 58, 237, 0.15), rgba(34, 211, 238, 0.15))',
              }}>
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className='mt-6 text-center text-sm text-white/65'>
            没有账号？{' '}
            <Link
              href='/register'
              className='underline hover:text-white/90'>
              去注册
            </Link>
          </p>
          <p className='mt-2 text-center text-sm text-white/65'>
            <Link
              href='/'
              className='underline hover:text-white/90'>
              返回首页
            </Link>
          </p>
        </div>
      </div>
    </HomeWithGalaxy>
  );
}
