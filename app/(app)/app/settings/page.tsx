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
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-medium tracking-wide text-white/90'>设置</h1>

      <section
        className='rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-md'
        style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
        <h2 className='mb-4 text-lg font-medium text-white/85'>账号信息</h2>
        <dl className='space-y-3'>
          <div>
            <dt className='text-xs text-white/55'>用户名</dt>
            <dd className='mt-0.5 text-white/90'>{user?.username ?? '-'}</dd>
          </div>
          <div>
            <dt className='text-xs text-white/55'>邮箱</dt>
            <dd className='mt-0.5 text-white/90'>{user?.email ?? '未绑定'}</dd>
          </div>
          {user?.tier && (
            <div>
              <dt className='text-xs text-white/55'>等级</dt>
              <dd className='mt-0.5 text-white/90'>{user.tier}</dd>
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
