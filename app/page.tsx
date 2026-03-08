'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
  ShoppingCart,
  Calendar
} from 'lucide-react';

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

export default function HomePage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [needReorderCount, setNeedReorderCount] = useState(0);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    orders_today: 0,
    sales_today: 0,
    orders_this_month: 0,
    sales_this_month: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, ordersRes, reorderRes] = await Promise.all([
        fetch('/api/inventory?limit=1000'),
        fetch('/api/orders?limit=1'),
        fetch('/api/reorder?limit=1000'),
      ]);
      const invData = await invRes.json();
      const ordersData = await ordersRes.json();
      const reorderData = await reorderRes.json();

      if (invData.ok) {
        const items = (invData.items || []).map((item: { variant_price?: string; [k: string]: unknown }) => ({
          ...item,
          price: item.variant_price ? parseFloat(item.variant_price) : null
        }));
        setInventoryItems(items);
      } else {
        setInventoryItems([]);
      }

      if (ordersData.ok && ordersData.stats) {
        setOrderStats({
          orders_today: ordersData.stats.orders_today ?? 0,
          sales_today: ordersData.stats.sales_today ?? 0,
          orders_this_month: ordersData.stats.orders_this_month ?? 0,
          sales_this_month: ordersData.stats.sales_this_month ?? 0,
        });
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
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.price || 0) * item.available_quantity), 0);
  const totalProducts = inventoryItems.length;
  const productsInStock = inventoryItems.filter(item => item.available_quantity > 0).reduce((sum, item) => sum + item.available_quantity, 0);
  const outOfStockCount = inventoryItems.filter(item => item.available_quantity === 0).length;
  const lowStockCount = needReorderCount; // ใช้ ROP จาก reorder

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ยินดีต้อนรับสู่ KiddyCare</h1>
          <p className="text-sm text-gray-600">ระบบจัดการสินค้าแม่และเด็กภายในร้านค้า</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">มูลค่ารวมทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : `฿${formatCurrency(totalValue)}`}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รายการสินค้าทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : totalProducts}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products in Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าในสต็อก</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : productsInStock}
                  </p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Card - ลิงก์ไปหน้าเติมของ */}
          <Link href="/reorder">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">สินค้าหมด</p>
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? '...' : outOfStockCount}
                    </p>
                    <p className="text-[0.65rem] text-red-600 mt-0.5">ต้องเติมสต็อกด่วน</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* ต้องเติมของ (ROP) Card - ลิงก์ไปหน้าเติมของ */}
          <Link href="/reorder">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ต้องเติมของ</p>
                    <p className="text-lg font-bold text-orange-600">
                      {loading ? '...' : lowStockCount}
                    </p>
                    <p className="text-[0.65rem] text-orange-600 mt-0.5">ดูคำแนะนำ ROP/EOQ</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Orders Today Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ออเดอร์วันนี้</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : orderStats.orders_today}
                  </p>
                  <p className="text-[0.65rem] text-gray-500 mt-0.5">
                    ยอดขาย ฿{loading ? '...' : formatCurrency(orderStats.sales_today)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders This Month Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ออเดอร์เดือนนี้</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : orderStats.orders_this_month}
                  </p>
                  <p className="text-[0.65rem] text-gray-500 mt-0.5">
                    ยอดขาย ฿{loading ? '...' : formatCurrency(orderStats.sales_this_month)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="mt-6 flex gap-2">
          <Link href="/reorder">
            <Button variant="outline" size="sm" className="text-xs">
              เติมของ (ROP/EOQ)
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" size="sm" className="text-xs">
              ดูรายการสั่งซื้อทั้งหมด
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}



