'use client';

import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import type { ApiError } from '@/lib/auth-types';

const verifySchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  code: z.string().min(1, '请输入验证码'),
});

type VerifyValues = z.infer<typeof verifySchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, token, isLoading, refreshProfile } = useContext(AuthContext);
  const [sendCodeError, setSendCodeError] = useState<string | null>(null);
  const [sendCodeSuccess, setSendCodeSuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: '', code: '' },
  });

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace('/login?callbackUrl=/verify-email');
    }
  }, [isLoading, token, user, router]);

  async function handleSendCode() {
    const email = form.getValues('email');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.setError('email', { message: '请输入有效的邮箱' });
      return;
    }
    setSendCodeError(null);
    setSendCodeSuccess(false);
    setSending(true);
    try {
      const res = await api('POST', '/auth/bind-email/send-code', {
        body: { email },
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setSendCodeError(data?.error ?? data?.message ?? `请求失败 (${res.status})`);
        setSending(false);
        return;
      }
      setSendCodeSuccess(true);
    } catch {
      setSendCodeError('网络错误，请重试');
    }
    setSending(false);
  }

  async function onSubmit(values: VerifyValues) {
    setVerifyError(null);
    setVerifySuccess(false);
    try {
      const res = await api('POST', '/auth/bind-email/verify', {
        body: { email: values.email, code: values.code },
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setVerifyError(data?.error ?? data?.message ?? `请求失败 (${res.status})`);
        return;
      }
      setVerifySuccess(true);
      await refreshProfile();
    } catch {
      setVerifyError('网络错误，请重试');
    }
  }

  if (isLoading || (!token && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <span className="text-muted-foreground">加载中…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">绑定邮箱</h1>
        {sendCodeError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {sendCodeError}
          </p>
        )}
        {sendCodeSuccess && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400" role="status">
            验证码已发送，请查收邮件。
          </p>
        )}
        {verifyError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {verifyError}
          </p>
        )}
        {verifySuccess && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400" role="status">
            绑定成功
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="email" placeholder="请输入邮箱" {...field} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendCode}
                        disabled={sending}>
                        {sending ? '发送中…' : '发送验证码'}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验证码</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="请输入邮件中的验证码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-2">
              确认绑定
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:no-underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
