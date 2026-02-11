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
        <p className='text-slate-500'>加载中...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-medium tracking-wide text-slate-800'>
        模拟交易
      </h1>

      {balance != null && (
        <section className='flex flex-wrap gap-4'>
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <p className='text-xs text-slate-500'>可用余额</p>
            <p className='mt-0.5 text-lg font-medium text-slate-800'>
              {Math.floor(parseFloat(balance.available) || 0)} USDT
            </p>
          </div>
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <p className='text-xs text-slate-500'>冻结</p>
            <p className='mt-0.5 text-lg font-medium text-slate-800'>
              {Math.floor(parseFloat(balance.frozen) || 0)} USDT
            </p>
          </div>
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-3 backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <p className='text-xs text-slate-500'>总权益</p>
            <p className='mt-0.5 text-lg font-medium text-slate-800'>
              {Math.floor(parseFloat(balance.totalEquity) || 0)} USDT
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className='mb-3 text-lg font-medium text-slate-700'>持仓列表</h2>
        {positions.length === 0 ? (
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-6 text-center backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <p className='text-slate-500'>暂无持仓</p>
          </div>
        ) : (
          <div
            className='overflow-hidden rounded-xl border border-slate-200 bg-white backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-slate-200'>
                  <th className='px-4 py-3 text-slate-600'>币种</th>
                  <th className='px-4 py-3 text-slate-600'>方向</th>
                  <th className='px-4 py-3 text-slate-600'>数量</th>
                  <th className='px-4 py-3 text-slate-600'>开仓价</th>
                  <th className='px-4 py-3 text-slate-600'>未实现盈亏</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr
                    key={p.symbol}
                    className='border-b border-slate-100'>
                    <td className='px-4 py-3 text-slate-800'>{p.symbol}</td>
                    <td className='px-4 py-3 text-slate-800'>{p.side}</td>
                    <td className='px-4 py-3 text-slate-800'>{p.size}</td>
                    <td className='px-4 py-3 text-slate-800'>{p.entryPrice}</td>
                    <td
                      className='px-4 py-3'
                      style={{
                        color:
                          parseFloat(String(p.unrealizedPnl ?? '0')) >= 0
                            ? 'rgb(52, 211, 153)'
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
        <h2 className='mb-3 text-lg font-medium text-slate-700'>活跃订单</h2>
        {orders.length === 0 ? (
          <div
            className='rounded-xl border border-slate-200 bg-white px-4 py-6 text-center backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <p className='text-slate-500'>暂无活跃订单</p>
          </div>
        ) : (
          <div
            className='overflow-hidden rounded-xl border border-slate-200 bg-white backdrop-blur-md'
            style={{ borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-slate-200'>
                  <th className='px-4 py-3 text-slate-600'>币种</th>
                  <th className='px-4 py-3 text-slate-600'>方向</th>
                  <th className='px-4 py-3 text-slate-600'>类型</th>
                  <th className='px-4 py-3 text-slate-600'>数量</th>
                  <th className='px-4 py-3 text-slate-600'>价格</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className='border-b border-slate-100'>
                    <td className='px-4 py-3 text-slate-800'>{o.symbol}</td>
                    <td className='px-4 py-3 text-slate-800'>{o.side}</td>
                    <td className='px-4 py-3 text-slate-800'>{o.type}</td>
                    <td className='px-4 py-3 text-slate-800'>{o.quantity}</td>
                    <td className='px-4 py-3 text-slate-800'>
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
