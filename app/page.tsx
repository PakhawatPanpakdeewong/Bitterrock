'use client'

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Sparkles,
  ArrowRight,
  LayoutList,
  Warehouse,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/components/utils/cn';

type InventoryItem = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  created_date: string | null;
  product_name_th: string;
  product_name_en: string;
  sub_category_name: string | null;
  variant_sku: string | null;
  price: number | null;
  is_active: boolean | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  warehouse_name: string;
};

type OrderStats = {
  orders_today: number;
  sales_today: number;
  orders_this_month: number;
  sales_this_month: number;
};

type DailyOrder = {
  order_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  item_count: number;
};

function formatOrderNumber(orderId: number, orderDate: string) {
  try {
    const date = new Date(orderDate);
    const beYear = date.getFullYear() + 543;
    const year = beYear.toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderNum = String(orderId).padStart(3, '0');
    return `#ORD-${year}${month}${day}-${orderNum}`;
  } catch {
    return `#ORD-${orderId}`;
  }
}

function paymentStatusBadge(paymentStatus: string) {
  switch (paymentStatus) {
    case 'completed':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60">
          สำเร็จ
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-amber-50 text-amber-900 ring-1 ring-amber-200/60">
          รอชำระ
        </span>
      );
    case 'failed':
    case 'refunded':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-rose-50 text-rose-800 ring-1 ring-rose-200/60">
          ยกเลิก
        </span>
      );
    default:
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
          {paymentStatus || '—'}
        </span>
      );
  }
}

function orderStatusBadge(orderStatus: string) {
  switch (orderStatus) {
    case 'confirmed':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-sky-50 text-sky-900 ring-1 ring-sky-200/60">
          ยืนยันออเดอร์
        </span>
      );
    case 'shipped':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-fuchsia-50 text-fuchsia-900 ring-1 ring-fuchsia-200/60">
          กำลังจัดส่ง
        </span>
      );
    case 'delivered':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/60">
          จัดส่งแล้ว
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-rose-50 text-rose-900 ring-1 ring-rose-200/60">
          ยกเลิก
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[0.7rem] font-medium bg-slate-50 text-slate-800 ring-1 ring-slate-200/70">
          ยังไม่ดำเนินการ
        </span>
      );
  }
}

type StatTileProps = {
  href?: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintClassName?: string;
  icon: React.ElementType;
  iconClass: string;
  loading?: boolean;
};

function StatTile({ href, label, value, hint, hintClassName, icon: Icon, iconClass, loading }: StatTileProps) {
  const body = (
    <Card
      className={cn(
        'h-full overflow-hidden border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200',
        href && 'hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md cursor-pointer group'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              {loading ? <span className="text-slate-400">…</span> : value}
            </p>
            {hint != null && (
              <p className={cn('mt-1.5 text-[0.7rem] leading-snug', hintClassName ?? 'text-slate-500')}>{hint}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/[0.04]',
              iconClass
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        {href && (
          <div className="mt-4 flex items-center text-[0.7rem] font-medium text-sky-700 opacity-0 transition-opacity group-hover:opacity-100">
            เปิดดู
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded-xl">
        {body}
      </Link>
    );
  }
  return body;
}

export default function HomePage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [needReorderCount, setNeedReorderCount] = useState(0);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    orders_today: 0,
    sales_today: 0,
    orders_this_month: 0,
    sales_this_month: 0,
  });
  const [todayOrders, setTodayOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, ordersRes, reorderRes] = await Promise.all([
        fetch('/api/inventory?limit=1000', { cache: 'no-store' }),
        fetch('/api/orders?limit=100&date=today', { cache: 'no-store' }),
        fetch('/api/reorder?limit=1000', { cache: 'no-store' }),
      ]);
      const invData = await invRes.json();
      const ordersData = await ordersRes.json();
      const reorderData = await reorderRes.json();

      if (invData.ok) {
        const items = (invData.items || []).map((item: { variant_price?: string; [k: string]: unknown }) => ({
          ...item,
          price: item.variant_price ? parseFloat(item.variant_price) : null,
        }));
        setInventoryItems(items);
      } else {
        setInventoryItems([]);
      }

      if (ordersData.ok) {
        if (ordersData.stats) {
          setOrderStats({
            orders_today: ordersData.stats.orders_today ?? 0,
            sales_today: ordersData.stats.sales_today ?? 0,
            orders_this_month: ordersData.stats.orders_this_month ?? 0,
            sales_this_month: ordersData.stats.sales_this_month ?? 0,
          });
        }
        setTodayOrders(Array.isArray(ordersData.items) ? ordersData.items : []);
      } else {
        setTodayOrders([]);
      }

      if (reorderData.ok && reorderData.items) {
        setNeedReorderCount(reorderData.items.filter((i: { needs_reorder: boolean }) => i.needs_reorder).length);
      } else {
        setNeedReorderCount(0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInventoryItems([]);
      setNeedReorderCount(0);
      setTodayOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = inventoryItems.length;
  const productsInStock = inventoryItems
    .filter((item) => item.available_quantity > 0)
    .reduce((sum, item) => sum + item.available_quantity, 0);
  const outOfStockCount = inventoryItems.filter((item) => item.available_quantity === 0).length;
  const lowStockCount = needReorderCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-indigo-300/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-sky-800 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                แดชบอร์ด
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                KiddyCare Inventory System
              </h1>
              <p className="mt-3 text-xs text-slate-500">{dateLabel ?? '\u00a0'}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white">
                  <Warehouse className="mr-1.5 h-3.5 w-3.5" />
                  คลังสินค้า
                </Button>
              </Link>
              <Link href="/reorder">
                <Button variant="outline" size="sm" className="border-amber-200/80 bg-amber-50/80 text-amber-950 shadow-sm hover:bg-amber-50">
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                  เติมของ
                </Button>
              </Link>
              <Link href="/orders">
                <Button size="sm" className="bg-sky-700 text-white shadow-sm hover:bg-sky-800">
                  <LayoutList className="mr-1.5 h-3.5 w-3.5" />
                  รายการสั่งซื้อ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* สต็อก */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">สต็อกสินค้า</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="รายการสินค้าทั้งหมด"
            value={totalProducts}
            icon={Package}
            iconClass="bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700"
            loading={loading}
          />
          <StatTile
            label="จำนวนชิ้นในสต็อก"
            value={productsInStock}
            icon={ShoppingBag}
            iconClass="bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-fuchsia-700"
            loading={loading}
          />
          <StatTile
            href="/reorder"
            label="สินค้าหมด"
            value={outOfStockCount}
            hint="ต้องเติมสต็อกด่วน"
            hintClassName="text-rose-600"
            icon={AlertTriangle}
            iconClass="bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700"
            loading={loading}
          />
          <StatTile
            href="/reorder"
            label="ต้องเติมของ (ROP)"
            value={lowStockCount}
            hint="ดูคำแนะนำ ROP / EOQ"
            hintClassName="text-amber-700"
            icon={AlertTriangle}
            iconClass="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-800"
            loading={loading}
          />
        </div>

        {/* ยอดขาย */}
        <div className="mb-3 mt-10 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ยอดขาย</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatTile
            label="ออเดอร์วันนี้"
            value={orderStats.orders_today}
            hint={<>ยอดขาย ฿{loading ? '…' : formatCurrency(orderStats.sales_today)}</>}
            icon={ShoppingCart}
            iconClass="bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700"
            loading={loading}
          />
          <StatTile
            label="ออเดอร์เดือนนี้"
            value={orderStats.orders_this_month}
            hint={<>ยอดขาย ฿{loading ? '…' : formatCurrency(orderStats.sales_this_month)}</>}
            icon={Calendar}
            iconClass="bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700"
            loading={loading}
          />
        </div>

        {/* รายการสั่งซื้อประจำวัน */}
        <Card className="mt-10 overflow-hidden border-slate-200/80 bg-white/95 shadow-md backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100/90 bg-gradient-to-r from-slate-50/90 to-sky-50/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-900">รายการสั่งซื้อประจำวัน</CardTitle>
              <p className="text-sm text-slate-500">ออเดอร์ที่สั่งในวันนี้ เรียงจากล่าสุด</p>
            </div>
            <Link href="/orders" className="mt-4 shrink-0 sm:mt-0">
              <Button variant="outline" size="sm" className="border-slate-200 bg-white shadow-sm">
                ดูทั้งหมด
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
                <p className="text-sm">กำลังโหลดข้อมูล…</p>
              </div>
            ) : todayOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-700">ยังไม่มีคำสั่งซื้อในวันนี้</p>
                <p className="max-w-sm text-xs text-slate-500">เมื่อมีออเดอร์ใหม่ รายการจะแสดงที่นี่ทันที</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="border-b border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        หมายเลขออเดอร์
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        ลูกค้า
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        ยอดรวม
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        จำนวน
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        ชำระเงิน
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        ออเดอร์
                      </TH>
                      <TH className="whitespace-nowrap py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                        วันที่สั่งซื้อ
                      </TH>
                    </TR>
                  </THead>
                  <TBody>
                    {todayOrders.map((order) => (
                      <TR
                        key={order.order_id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-sky-50/40"
                      >
                        <TD className="py-3 text-xs font-semibold text-slate-900">
                          {formatOrderNumber(order.order_id, order.order_date)}
                        </TD>
                        <TD className="py-3 text-xs">
                          <div className="font-medium text-slate-900">
                            คุณ {order.customer_first_name} {order.customer_last_name}
                          </div>
                          <div className="max-w-[220px] truncate text-[0.7rem] text-slate-500">{order.customer_email}</div>
                        </TD>
                        <TD className="whitespace-nowrap py-3 text-xs font-semibold tabular-nums text-slate-900">
                          ฿{formatCurrency(order.total_amount)}
                        </TD>
                        <TD className="py-3 text-xs text-slate-600">{order.item_count} รายการ</TD>
                        <TD className="py-3">{paymentStatusBadge(order.payment_status)}</TD>
                        <TD className="py-3">{orderStatusBadge(order.order_status)}</TD>
                        <TD className="whitespace-nowrap py-3 text-xs text-slate-600">{formatDate(order.order_date)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
