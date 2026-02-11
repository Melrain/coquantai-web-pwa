'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { GenericForm } from '@/components/GenericForm';
import { api } from '@/lib/api-client';
import type { ApiError } from '@/lib/auth-types';

const resetSchema = z
  .object({
    newPassword: z.string().min(6, '密码至少 6 位'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type ResetValues = z.infer<typeof resetSchema>;

const resetFields = [
  {
    name: 'newPassword' as const,
    label: '新密码',
    type: 'password' as const,
    placeholder: '请输入新密码（至少 6 位）',
  },
  {
    name: 'confirmPassword' as const,
    label: '确认密码',
    type: 'password' as const,
    placeholder: '请再次输入新密码',
  },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function onSubmit(values: ResetValues) {
    if (!token) {
      setSubmitError('链接无效，请从邮件中重新打开');
      return;
    }
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await api('POST', '/auth/reset-password', {
        body: { token, newPassword: values.newPassword },
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setSubmitError(data?.error ?? data?.message ?? `请求失败 (${res.status})`);
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setSubmitError('网络错误，请重试');
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-4 py-8">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 text-center text-xl font-semibold">重置密码</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            链接无效或已过期，请从邮件中重新打开重置链接。
          </p>
          <Link href="/forgot-password" className="text-sm underline hover:no-underline">
            重新申请重置
          </Link>
          {' · '}
          <Link href="/login" className="text-sm underline hover:no-underline">
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">重置密码</h1>
        {submitError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400" role="status">
            密码已重置，正在跳转到登录页…
          </p>
        )}
        <GenericForm<ResetValues>
          schema={resetSchema}
          fields={resetFields}
          submitLabel="确认重置"
          onSubmit={onSubmit}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline hover:no-underline">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sky-50">
          <span className="text-muted-foreground">加载中…</span>
        </div>
      }>
      <ResetPasswordForm />
    </Suspense>
  );
}
