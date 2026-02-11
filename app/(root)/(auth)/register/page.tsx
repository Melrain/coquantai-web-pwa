'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const register = useAuthStore((s) => s.register);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!agreed) {
      setError('请勾选同意隐私政策');
      return;
    }
    try {
      await register(
        username.trim(),
        password,
        agreed,
        email.trim() || undefined
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    }
  };

  return (
    <div className='min-h-screen bg-sky-50'>
      <div
        className='relative flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8'
        style={{
          paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 3.5rem))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}>
        <div className='w-full max-w-sm'>
          <h2 className='text-center text-xl font-medium tracking-[0.2em] text-slate-800'>
            注册
          </h2>
          <form
            onSubmit={handleSubmit}
            className='mt-8 flex flex-col gap-4'>
            <div>
              <label
                htmlFor='username'
                className='mb-1.5 block text-sm text-slate-600'>
                用户名
              </label>
              <input
                id='username'
                type='text'
                value={username}
                onChange={(e) => setUsername((e.target as unknown as { value: string }).value)}
                autoComplete='username'
                disabled={isLoading}
                className='w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60'
                placeholder='请输入用户名'
              />
            </div>
            <div>
              <label
                htmlFor='email'
                className='mb-1.5 block text-sm text-slate-600'>
                邮箱（可选）
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail((e.target as unknown as { value: string }).value)}
                autoComplete='email'
                disabled={isLoading}
                className='w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60'
                placeholder='请输入邮箱'
              />
            </div>
            <div>
              <label
                htmlFor='password'
                className='mb-1.5 block text-sm text-slate-600'>
                密码（至少 6 位）
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword((e.target as unknown as { value: string }).value)}
                autoComplete='new-password'
                disabled={isLoading}
                className='w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60'
                placeholder='请输入密码'
              />
            </div>
            <div>
              <label
                htmlFor='confirmPassword'
                className='mb-1.5 block text-sm text-slate-600'>
                确认密码
              </label>
              <input
                id='confirmPassword'
                type='password'
                value={confirmPassword}
                onChange={(e) =>
                setConfirmPassword((e.target as unknown as { value: string }).value)}
                autoComplete='new-password'
                disabled={isLoading}
                className='w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60'
                placeholder='请再次输入密码'
              />
            </div>
            <label className='flex cursor-pointer items-start gap-3'>
              <input
                type='checkbox'
                checked={agreed}
                onChange={(e) => setAgreed((e.target as unknown as { checked: boolean }).checked)}
                disabled={isLoading}
                className='mt-1 size-4 rounded border-slate-200 bg-slate-100'
              />
              <span className='text-sm text-slate-600'>
                我已阅读并同意
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
                  }/legal/privacy`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:text-slate-800'>
                  隐私政策
                </a>
              </span>
            </label>
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
              className='mt-2 rounded-xl border border-blue-400/50 px-6 py-3 text-sm font-medium text-slate-800 transition-all hover:border-blue-500 hover:shadow-[0_0_16px_rgba(37,99,235,0.2)] disabled:opacity-60'
              style={{
                background:
                  'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.12))',
              }}>
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>
          <p className='mt-6 text-center text-sm text-slate-500'>
            已有账号？{' '}
            <Link
              href='/login'
              className='underline hover:text-slate-800'>
              去登录
            </Link>
          </p>
          <p className='mt-2 text-center text-sm text-slate-500'>
            <Link
              href='/'
              className='underline hover:text-slate-800'>
              返回首页
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
