export default function OfflinePage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-8'>
      <h1 className='text-xl font-semibold'>当前处于离线状态</h1>
      <p className='mt-2 text-neutral-600'>请检查网络连接后重试。</p>
    </main>
  );
}
