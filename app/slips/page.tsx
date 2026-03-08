'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt, Search, ArrowRight, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react';

type SlipOrderItem = {
  order_id: number;
  payment_id: number;
  order_date: string;
  total_amount: number;
  payment_status: string;
  customer_name: string;
};

export default function SlipsPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState<SlipOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchOrder.trim()) params.set('search', searchOrder.trim());
      params.set('limit', '50');
      const res = await fetch(`/api/slips/orders?${params}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchOrder]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const handleViewSlip = (oid: number, pid: number) => {
    router.push(`/slips/${oid}/${pid}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const oid = orderId.trim();
    const pid = paymentId.trim();
    if (!oid || !pid) {
      setError('กรุณากรอก Order ID และ Payment ID');
      return;
    }
    const o = parseInt(oid, 10);
    const p = parseInt(pid, 10);
    if (isNaN(o) || isNaN(p) || o < 1 || p < 1) {
      setError('Order ID และ Payment ID ต้องเป็นตัวเลขที่ถูกต้อง');
      return;
    }
    router.push(`/slips/${o}/${p}`);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  const statusLabel: Record<string, string> = {
    pending: 'รอชำระ',
    completed: 'ชำระแล้ว',
    failed: 'ล้มเหลว',
    refunded: 'คืนเงิน',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="border-pink-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-pink-500" />
            ดูสลิปการชำระเงิน
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            ค้นหาตาม Order ID หรือเลือกจากรายการด้านล่างเพื่อดูสลิป
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search by Order */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="ค้นหา Order ID (เช่น 54, 66)"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchOrders} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* List of orders with payments */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                กำลังโหลด...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {searchOrder.trim() ? 'ไม่พบออเดอร์ที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการออเดอร์ที่มีการชำระเงิน'}
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.order_id}-${item.payment_id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-pink-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          Order #{item.order_id}
                        </span>
                        <span className="text-xs text-gray-500">
                          Payment #{item.payment_id}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.payment_status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : item.payment_status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabel[item.payment_status] || item.payment_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {item.customer_name} · {formatDate(item.order_date)} · ฿{Number(item.total_amount).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="ml-3 shrink-0 bg-pink-500 hover:bg-pink-600"
                      onClick={() => handleViewSlip(item.order_id, item.payment_id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      ดูสลิป
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!loading && total > items.length && (
              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                แสดง {items.length} จาก {total} รายการ
              </div>
            )}
          </div>

          {/* Manual form (collapsible) */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              ดูสลิปด้วย Order ID และ Payment ID โดยตรง
              {showManualForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showManualForm && (
              <div className="px-4 pb-4 pt-0 border-t">
                <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                      <Input
                        type="text"
                        placeholder="เช่น 123"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
                      <Input
                        type="text"
                        placeholder="เช่น 456"
                        value={paymentId}
                        onChange={(e) => setPaymentId(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
                    <Search className="w-4 h-4 mr-2" />
                    ดูสลิป
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
