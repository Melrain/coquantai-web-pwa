'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { GenericForm } from '@/components/GenericForm';
import { api } from '@/lib/api-client';
import type { ApiError } from '@/lib/auth-types';

const forgotSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

const forgotFields = [
  {
    name: 'username' as const,
    label: '用户名',
    type: 'text' as const,
    placeholder: '请输入注册时使用的用户名',
  },
];

export default function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function onSubmit(values: ForgotValues) {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await api('POST', '/auth/forgot-password', { body: values });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setSubmitError(data?.error ?? data?.message ?? `请求失败 (${res.status})`);
        return;
      }
      setSubmitSuccess(true);
    } catch {
      setSubmitError('网络错误，请重试');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">忘记密码</h1>
        {submitError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400" role="status">
            若该账号存在，将收到重置邮件，请查收并点击邮件中的链接完成重置。
          </p>
        )}
        <GenericForm<ForgotValues>
          schema={forgotSchema}
          fields={forgotFields}
          submitLabel="发送重置邮件"
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
