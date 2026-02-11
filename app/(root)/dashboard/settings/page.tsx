'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { logout } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className='mx-auto max-w-2xl flex flex-col gap-6'>
      <h1 className='text-2xl font-medium tracking-wide text-slate-800'>设置</h1>

      <section
        className='rounded-xl border border-slate-200 bg-white p-5 backdrop-blur-md'
        style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
        <h2 className='mb-4 text-lg font-medium text-slate-700'>账号信息</h2>
        <dl className='space-y-3'>
          <div>
            <dt className='text-xs text-slate-500'>用户名</dt>
            <dd className='mt-0.5 text-slate-800'>{user?.username ?? '-'}</dd>
          </div>
          <div>
            <dt className='text-xs text-slate-500'>邮箱</dt>
            <dd className='mt-0.5 text-slate-800'>{user?.email ?? '未绑定'}</dd>
          </div>
          {user?.tier && (
            <div>
              <dt className='text-xs text-slate-500'>等级</dt>
              <dd className='mt-0.5 text-slate-800'>{user.tier}</dd>
            </div>
          )}
        </dl>
      </section>

      <section>
        <button
          type='button'
          onClick={handleLogout}
          className='rounded-xl border border-red-400/40 px-6 py-3 text-sm font-medium text-red-300/90 transition-all hover:border-red-400/60 hover:bg-red-400/10'>
          退出登录
        </button>
      </section>
    </div>
  );
}
