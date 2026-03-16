'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, BarChart3, ShoppingBag } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

type DailySummary = {
  summary_date: string;
  total_revenue: number;
  total_quantity: number;
};

type TopProduct = {
  product_id: number;
  product_name_th: string;
  product_name_en: string | null;
  total_revenue: number;
  total_quantity: number;
};

type SalesSummaryResponse = {
  ok: boolean;
  totals?: {
    total_revenue: number;
    total_quantity: number;
    summary_days: number;
  };
  daily?: DailySummary[];
  topProducts?: TopProduct[];
  error?: string;
};

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

export default function SalesSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesSummaryResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sales-summary');
        const json: SalesSummaryResponse = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error loading sales summary:', err);
        setData({ ok: false, error: 'ไม่สามารถโหลดข้อมูลสรุปการขายได้' });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const totals = data?.totals || {
    total_revenue: 0,
    total_quantity: 0,
    summary_days: 0,
  };

  const dailyRaw = data?.daily || [];

  const daily = dailyRaw.map((d) => {
    const dateObj = new Date(d.summary_date);
    const oneJan = new Date(dateObj.getFullYear(), 0, 1);
    const dayOfYear =
      (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) -
        Date.UTC(oneJan.getFullYear(), oneJan.getMonth(), oneJan.getDate())) /
        86400000 +
      1;
    const week = Math.ceil(dayOfYear / 7);
    return {
      ...d,
      dateLabel: dateObj.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
      }),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      week,
    };
  });

  // Aggregate for week, month and quarter views
  const weeklyMap = new Map<string, { label: string; total_revenue: number }>();
  const monthlyMap = new Map<string, { label: string; total_revenue: number }>();
  const quarterlyMap = new Map<string, { label: string; total_revenue: number }>();

  daily.forEach((d) => {
    const wKey = `${d.year}-W${d.week.toString().padStart(2, '0')}`;
    const wLabel = `สัปดาห์ ${d.week} (${d.year + 543})`;
    const w = weeklyMap.get(wKey) || { label: wLabel, total_revenue: 0 };
    w.total_revenue += d.total_revenue;
    weeklyMap.set(wKey, w);

    const ymKey = `${d.year}-${d.month.toString().padStart(2, '0')}`;
    const monthLabel = new Date(d.year, d.month - 1, 1).toLocaleDateString('th-TH', {
      month: 'short',
      year: '2-digit',
    });
    const m = monthlyMap.get(ymKey) || { label: monthLabel, total_revenue: 0 };
    m.total_revenue += d.total_revenue;
    monthlyMap.set(ymKey, m);

    const quarter = Math.floor((d.month - 1) / 3) + 1;
    const qKey = `${d.year}-Q${quarter}`;
    const qLabel = `Q${quarter} ${d.year + 543}`;
    const q = quarterlyMap.get(qKey) || { label: qLabel, total_revenue: 0 };
    q.total_revenue += d.total_revenue;
    quarterlyMap.set(qKey, q);
  });

  const weekly = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const quarterly = Array.from(quarterlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const chartData: { label?: string; dateLabel?: string; total_revenue: number }[] =
    viewMode === 'day'
      ? daily
      : viewMode === 'week'
      ? weekly
      : viewMode === 'month'
      ? monthly
      : quarterly;

  const topProducts = data?.topProducts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              สรุปภาพรวมการขาย
            </h1>
            <p className="text-sm text-gray-600">
              ดูภาพรวมยอดขาย การรับชำระเงิน และสินค้าขายดีจากตารางสรุปยอดขาย (salessummary)
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs">
              กลับหน้าแรก
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ยอดขายรวมที่บันทึก</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {loading ? '...' : `฿${formatCurrency(totals.total_revenue)}`}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    รวมจากทุกวันที่มีการสรุปยอด
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    จำนวนชิ้นสินค้าที่ขายได้
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {loading ? '...' : totals.total_quantity.toLocaleString()}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    จำนวนรวมจากทุก order ที่สรุปไว้
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    จำนวนวันที่มีการสรุปยอดขาย
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {loading ? '...' : totals.summary_days}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    ใช้ดูช่วงเวลาที่มีการบันทึกข้อมูลการขาย
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-sky-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    กราฟยอดขาย
                  </p>
                  <p className="text-[0.7rem] text-gray-500">
                    สรุปจาก totalrevenue ปรับมุมมองได้ทั้งรายวัน / รายสัปดาห์ / รายเดือน / รายไตรมาส
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={viewMode === 'day' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[0.7rem]"
                    onClick={() => setViewMode('day')}
                  >
                    รายวัน
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[0.7rem]"
                    onClick={() => setViewMode('week')}
                  >
                    รายสัปดาห์
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[0.7rem]"
                    onClick={() => setViewMode('month')}
                  >
                    รายเดือน
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'quarter' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[0.7rem]"
                    onClick={() => setViewMode('quarter')}
                  >
                    รายไตรมาส
                  </Button>
                </div>
              </div>

              {loading ? (
                <p className="text-xs text-gray-500">กำลังโหลดข้อมูล...</p>
              ) : chartData.length === 0 ? (
                <p className="text-xs text-gray-500">
                  ยังไม่มีข้อมูลสรุปยอดขายในตาราง salessummary
                </p>
              ) : (
                <div className="mt-2 h-64 border border-dashed border-gray-200 rounded-lg px-3 py-3 bg-gradient-to-b from-white to-emerald-50/40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey={viewMode === 'day' ? 'dateLabel' : 'label'}
                        tick={{ fontSize: 10, fill: '#4b5563' }}
                        interval={0}
                        height={32}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <Tooltip
                        formatter={(value) =>
                          [`฿${formatCurrency(Number(value ?? 0))}`, 'ยอดขาย']
                        }
                        labelFormatter={(label) => {
                          const text = String(label ?? '');
                          if (viewMode === 'day') return `วันที่ ${text}`;
                          if (viewMode === 'week') return text;
                          if (viewMode === 'month') return `เดือน ${text}`;
                          return text;
                        }}
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 8,
                          borderColor: '#e5e7eb',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    สินค้าขายดีที่สุด
                  </p>
                  <p className="text-[0.7rem] text-gray-500">
                    จากการรวม totalquantitysold ต่อสินค้า
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-pink-600" />
                </div>
              </div>

              {loading ? (
                <p className="text-xs text-gray-500">กำลังโหลดข้อมูล...</p>
              ) : topProducts.length === 0 ? (
                <p className="text-xs text-gray-500">
                  ยังไม่มีข้อมูลสินค้าขายดีจากตาราง salessummary
                </p>
              ) : (
                <ul className="space-y-2">
                  {topProducts.map((p, index) => (
                    <li
                      key={p.product_id}
                      className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] font-semibold text-gray-500 w-5 text-right">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {p.product_name_th}
                          </p>
                          {p.product_name_en && (
                            <p className="text-[0.65rem] text-gray-500">
                              {p.product_name_en}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          {p.total_quantity.toLocaleString()} ชิ้น
                        </p>
                        <p className="text-[0.65rem] text-emerald-600">
                          ฿{formatCurrency(p.total_revenue)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

