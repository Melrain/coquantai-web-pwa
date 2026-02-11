'use client';

import { useEffect, useState } from 'react';
import {
  getSimTradeBalance,
  getSimTradePositions,
  getSimTradeActiveOrders,
  type SimTradeBalanceResponse,
  type SimTradePosition,
  type SimTradeOrder,
} from '@/lib/api';

export default function SimTradePage() {
  const [balance, setBalance] = useState<SimTradeBalanceResponse | null>(null);
  const [positions, setPositions] = useState<SimTradePosition[]>([]);
  const [orders, setOrders] = useState<SimTradeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [b, p, o] = await Promise.all([
          getSimTradeBalance(),
          getSimTradePositions(),
          getSimTradeActiveOrders(),
        ]);
        setBalance(b);
        setPositions(p);
        setOrders(o);
      } catch {
        setBalance(null);
        setPositions([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-white/65'>加载中...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-medium tracking-wide text-white/90'>
        模拟交易
      </h1>

      {balance != null && (
        <section className='flex flex-wrap gap-4'>
          <div
            className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <p className='text-xs text-white/60'>可用余额</p>
            <p className='mt-0.5 text-lg font-medium text-white/90'>
              {balance.available} USDT
            </p>
          </div>
          <div
            className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <p className='text-xs text-white/60'>冻结</p>
            <p className='mt-0.5 text-lg font-medium text-white/90'>
              {balance.frozen} USDT
            </p>
          </div>
          <div
            className='rounded-xl border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <p className='text-xs text-white/60'>总权益</p>
            <p className='mt-0.5 text-lg font-medium text-white/90'>
              {balance.totalEquity} USDT
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className='mb-3 text-lg font-medium text-white/85'>持仓列表</h2>
        {positions.length === 0 ? (
          <div
            className='rounded-xl border border-white/20 bg-white/5 px-4 py-6 text-center backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <p className='text-white/55'>暂无持仓</p>
          </div>
        ) : (
          <div
            className='overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-white/20'>
                  <th className='px-4 py-3 text-white/70'>币种</th>
                  <th className='px-4 py-3 text-white/70'>方向</th>
                  <th className='px-4 py-3 text-white/70'>数量</th>
                  <th className='px-4 py-3 text-white/70'>开仓价</th>
                  <th className='px-4 py-3 text-white/70'>未实现盈亏</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr
                    key={p.symbol}
                    className='border-b border-white/10'>
                    <td className='px-4 py-3 text-white/90'>{p.symbol}</td>
                    <td className='px-4 py-3 text-white/90'>{p.side}</td>
                    <td className='px-4 py-3 text-white/90'>{p.size}</td>
                    <td className='px-4 py-3 text-white/90'>{p.entryPrice}</td>
                    <td
                      className='px-4 py-3'
                      style={{
                        color:
                          parseFloat(String(p.unrealizedPnl ?? '0')) >= 0
                            ? 'rgb(34, 211, 238)'
                            : 'rgb(248, 113, 113)',
                      }}>
                      {p.unrealizedPnl ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className='mb-3 text-lg font-medium text-white/85'>活跃订单</h2>
        {orders.length === 0 ? (
          <div
            className='rounded-xl border border-white/20 bg-white/5 px-4 py-6 text-center backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <p className='text-white/55'>暂无活跃订单</p>
          </div>
        ) : (
          <div
            className='overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-md'
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-white/20'>
                  <th className='px-4 py-3 text-white/70'>币种</th>
                  <th className='px-4 py-3 text-white/70'>方向</th>
                  <th className='px-4 py-3 text-white/70'>类型</th>
                  <th className='px-4 py-3 text-white/70'>数量</th>
                  <th className='px-4 py-3 text-white/70'>价格</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className='border-b border-white/10'>
                    <td className='px-4 py-3 text-white/90'>{o.symbol}</td>
                    <td className='px-4 py-3 text-white/90'>{o.side}</td>
                    <td className='px-4 py-3 text-white/90'>{o.type}</td>
                    <td className='px-4 py-3 text-white/90'>{o.quantity}</td>
                    <td className='px-4 py-3 text-white/90'>
                      {o.price ?? o.stopPrice ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
