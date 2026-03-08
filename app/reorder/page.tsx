'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  RefreshCw,
  Search,
  Package,
  AlertTriangle,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';

type ReorderItem = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  product_name_th: string;
  product_name_en: string;
  sub_category_name: string | null;
  variant_sku: string | null;
  price: number | null;
  warehouse_name: string;
  attribute_value_th?: string | null;
  reorder_params: {
    daily_demand: number;
    lead_time_days: number;
    safety_stock: number;
    ordering_cost: number;
    holding_cost_percent: number;
  };
  has_custom_params: boolean;
  rop: number;
  eoq: number;
  needs_reorder: boolean;
  suggested_order_qty: number;
};

type ReorderParams = {
  daily_demand: number;
  lead_time_days: number;
  safety_stock: number;
  ordering_cost: number;
  holding_cost_percent: number;
};

function calcROP(dd: number, lt: number, ss: number): number {
  return Math.ceil(dd * lt + ss);
}
function calcEOQ(dd: number, oc: number, hcPerUnit: number): number {
  const annual = dd * 365;
  if (hcPerUnit <= 0) return Math.ceil(annual);
  return Math.ceil(Math.max(1, Math.sqrt((2 * annual * oc) / hcPerUnit)));
}

function SettingsModalContent({
  editingItem,
  editParams,
  setEditParams,
  calcROP,
  calcEOQ,
  saving,
  onClose,
  onSave,
}: {
  editingItem: ReorderItem | null;
  editParams: ReorderParams;
  setEditParams: React.Dispatch<React.SetStateAction<ReorderParams>>;
  calcROP: (dd: number, lt: number, ss: number) => number;
  calcEOQ: (dd: number, oc: number, hc: number) => number;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const unitPrice = editingItem?.price ?? 0;
  const holdingCostPerUnit =
    unitPrice > 0 ? unitPrice * (editParams.holding_cost_percent / 100) : editParams.ordering_cost * 0.1;

  const previewROP = calcROP(
    editParams.daily_demand,
    editParams.lead_time_days,
    editParams.safety_stock
  );
  const previewEOQ = calcEOQ(
    editParams.daily_demand,
    editParams.ordering_cost,
    holdingCostPerUnit
  );

  const beforeROP = editingItem?.rop ?? previewROP;
  const beforeEOQ = editingItem?.eoq ?? previewEOQ;
  const hasChanged =
    beforeROP !== previewROP || beforeEOQ !== previewEOQ;

  return (
    <>
      <div className="space-y-5">
        {/* พารามิเตอร์สำหรับ ROP */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            พารามิเตอร์สำหรับ ROP (จุดสั่งซื้อ)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">ความต้องการต่อวัน (หน่วย)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={editParams.daily_demand}
                onChange={(e) =>
                  setEditParams((p) => ({ ...p, daily_demand: Number(e.target.value) || 0 }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">ระยะเวลานำเข้าสินค้า (วัน)</Label>
              <Input
                type="number"
                min={0}
                value={editParams.lead_time_days}
                onChange={(e) =>
                  setEditParams((p) => ({ ...p, lead_time_days: Number(e.target.value) || 0 }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">สต็อกความปลอดภัย (หน่วย)</Label>
              <Input
                type="number"
                min={0}
                value={editParams.safety_stock}
                onChange={(e) =>
                  setEditParams((p) => ({ ...p, safety_stock: Number(e.target.value) || 0 }))
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* พารามิเตอร์สำหรับ EOQ */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            พารามิเตอร์สำหรับ EOQ (ปริมาณสั่งซื้อ)
          </h4>
          {editingItem && unitPrice > 0 && (
            <p className="text-xs text-gray-500">
              ราคาต่อหน่วย: ฿{unitPrice.toLocaleString('th-TH')} — ค่าเก็บรักษา = ราคา × {editParams.holding_cost_percent}%
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ค่าคำสั่งซื้อต่อครั้ง (บาท)</Label>
              <Input
                type="number"
                min={0}
                value={editParams.ordering_cost}
                onChange={(e) =>
                  setEditParams((p) => ({ ...p, ordering_cost: Number(e.target.value) || 0 }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">ค่าเก็บรักษา (% ของราคา/ปี)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={editParams.holding_cost_percent}
                onChange={(e) =>
                  setEditParams((p) => ({
                    ...p,
                    holding_cost_percent: Number(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* เปรียบเทียบ ROP/EOQ */}
        <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700">เปรียบเทียบการเปลี่ยนแปลง</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">ROP (จุดสั่งซื้อ)</p>
              <div className="flex items-center gap-2">
                <span className={hasChanged ? 'text-gray-400 line-through' : ''}>
                  {beforeROP} หน่วย
                </span>
                {hasChanged && (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-blue-600">{previewROP} หน่วย</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">EOQ (ปริมาณสั่งซื้อ)</p>
              <div className="flex items-center gap-2">
                <span className={hasChanged ? 'text-gray-400 line-through' : ''}>
                  {beforeEOQ} หน่วย
                </span>
                {hasChanged && (
                  <>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-green-600">{previewEOQ} หน่วย</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {editingItem && editingItem.available_quantity <= previewROP && (
            <p className="text-xs text-orange-600 mt-2">
              แนะนำสั่งซื้อ: {Math.max(previewEOQ, previewROP - editingItem.available_quantity)} หน่วย
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          ยกเลิก
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </>
  );
}

export default function ReorderPage() {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showOnlyNeedReorder, setShowOnlyNeedReorder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  // Settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReorderItem | null>(null);
  const [editParams, setEditParams] = useState<ReorderParams>({
    daily_demand: 5,
    lead_time_days: 7,
    safety_stock: 10,
    ordering_cost: 100,
    holding_cost_percent: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reorder?limit=1000');
      const data = await res.json();
      if (data.ok) {
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching reorder data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openSettingsModal = (item: ReorderItem | null) => {
    setEditingItem(item);
    setEditParams(
      item?.reorder_params ?? {
        daily_demand: 5,
        lead_time_days: 7,
        safety_stock: 10,
        ordering_cost: 100,
        holding_cost_percent: 10,
      }
    );
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setEditingItem(null);
  };

  const saveSettings = async () => {
    if (!editingItem?.variant_id) {
      closeSettingsModal();
      return;
    }
    try {
      setSaving(true);
      const payload = {
        variant_id: editingItem.variant_id,
        warehouse_id: editingItem.warehouse_id,
        ...editParams,
      };

      const res = await fetch('/api/reorder-params', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        await fetchData();
        closeSettingsModal();
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error saving params:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const resetItemParams = async (item: ReorderItem) => {
    if (!item.variant_id) return;
    try {
      const res = await fetch(
        `/api/reorder-params?variant_id=${item.variant_id}&warehouse_id=${item.warehouse_id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        await fetchData();
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error resetting params:', error);
      alert('เกิดข้อผิดพลาดในการรีเซ็ต');
    }
  };

  // Filter items (client-side filter on pre-calculated data)
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.product_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.variant_sku && item.variant_sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesWarehouse =
      selectedWarehouse === 'all' || item.warehouse_name === selectedWarehouse;
    const matchesReorder = !showOnlyNeedReorder || item.needs_reorder;
    return matchesSearch && matchesWarehouse && matchesReorder;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const needReorderCount = items.filter((i) => i.needs_reorder).length;
  const filterWarehouses = Array.from(
    new Set(items.map((i) => i.warehouse_name).filter(Boolean) as string[])
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">เติมของ (Reorder)</h1>
              <p className="text-xs text-gray-600 mt-1">
                คำนวณจุดสั่งซื้อ (ROP) และปริมาณสั่งซื้อที่เหมาะสม (EOQ)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รายการสินค้าทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">{items.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ต้องเติมของ</p>
                  <p className="text-lg font-bold text-orange-600">{needReorderCount}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สูตรคำนวณ</p>
                  <p className="text-sm font-medium text-gray-700">ROP & EOQ</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formula Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold">หลักการคำนวณ</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ROP */}
              <div className="space-y-3 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                <h4 className="font-semibold text-blue-800">ROP (Reorder Point) — จุดสั่งซื้อ</h4>
                <p className="text-gray-600 text-xs">
                  ระดับสต็อกที่ควรสั่งซื้อเพิ่ม เพื่อไม่ให้สินค้าหมดก่อนของถึง
                </p>
                <div className="bg-white rounded px-3 py-2 font-mono text-sm text-gray-800">
                  ROP = (ความต้องการต่อวัน × ระยะเวลานำเข้าสินค้า) + สต็อกความปลอดภัย
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>ความต้องการต่อวัน</strong> — ยอดขายเฉลี่ยต่อวัน (หน่วย)</li>
                  <li>• <strong>ระยะเวลานำเข้าสินค้า</strong> — จำนวนวันจากสั่งซื้อจนถึงของถึงคลัง</li>
                  <li>• <strong>สต็อกความปลอดภัย</strong> — จำนวนสำรองเพื่อป้องกันสินค้าหมด</li>
                </ul>
              </div>

              {/* EOQ */}
              <div className="space-y-3 p-4 rounded-lg bg-green-50/50 border border-green-100">
                <h4 className="font-semibold text-green-800">EOQ (Economic Order Quantity) — ปริมาณสั่งซื้อที่เหมาะสม</h4>
                <p className="text-gray-600 text-xs">
                  จำนวนที่ควรสั่งซื้อแต่ละครั้ง เพื่อลดต้นทุนรวม (ค่าสั่งซื้อ + ค่าเก็บรักษา)
                </p>
                <div className="bg-white rounded px-3 py-2 font-mono text-sm text-gray-800">
                  EOQ = √(2 × D × S ÷ H)
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>D</strong> — ความต้องการต่อปี (หน่วย)</li>
                  <li>• <strong>S</strong> — ค่าคำสั่งซื้อต่อครั้ง (บาท)</li>
                  <li>• <strong>H</strong> — ค่าเก็บรักษาต่อหน่วยต่อปี (บาท)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">รายการสินค้าและคำแนะนำการเติมของ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาสินค้า"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select
                value={selectedWarehouse}
                onValueChange={(v: string) => {
                  setSelectedWarehouse(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="คลังสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคลัง</SelectItem>
                  {filterWarehouses.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyNeedReorder}
                  onChange={(e) => {
                    setShowOnlyNeedReorder(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded"
                />
                แสดงเฉพาะที่ต้องเติมของ
              </label>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH className="text-xs">สินค้า</TH>
                    <TH className="text-xs">SKU</TH>
                    <TH className="text-xs">คลัง</TH>
                    <TH className="text-xs text-right">คงเหลือ</TH>
                    <TH className="text-xs text-right">ROP</TH>
                    <TH className="text-xs text-right">EOQ</TH>
                    <TH className="text-xs text-right">แนะนำสั่งซื้อ</TH>
                    <TH className="text-xs text-center">สถานะ</TH>
                    <TH className="text-xs text-center">ตั้งค่า</TH>
                  </TR>
                </THead>
                <TBody>
                  {paginatedItems.map((item) => (
                    <TR key={item.inventory_id}>
                      <TD className="text-xs">
                        <div>
                          <p className="font-medium">{item.product_name_th || item.product_name_en}</p>
                          {item.attribute_value_th && (
                            <p className="text-gray-500 text-[0.65rem]">{item.attribute_value_th}</p>
                          )}
                        </div>
                      </TD>
                      <TD className="text-xs">{item.variant_sku || '-'}</TD>
                      <TD className="text-xs">{item.warehouse_name || '-'}</TD>
                      <TD className="text-xs text-right font-medium">
                        {item.available_quantity}
                      </TD>
                      <TD className="text-xs text-right">{item.rop}</TD>
                      <TD className="text-xs text-right">{item.eoq}</TD>
                      <TD className="text-xs text-right">
                        {item.needs_reorder ? (
                          <span className="font-semibold text-orange-600">
                            {item.suggested_order_qty} หน่วย
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TD>
                      <TD className="text-center">
                        {item.needs_reorder ? (
                          <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-orange-100 text-orange-800">
                            ต้องเติม
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-green-100 text-green-800">
                            พอใช้
                          </span>
                        )}
                      </TD>
                      <TD className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openSettingsModal(item)}
                          >
                            {item.has_custom_params ? (
                              <span className="text-amber-600">แก้ไข</span>
                            ) : (
                              'ตั้งค่า'
                            )}
                          </Button>
                          {item.has_custom_params && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-gray-500"
                              onClick={() => resetItemParams(item)}
                            >
                              รีเซ็ต
                            </Button>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            {paginatedItems.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                ไม่พบรายการสินค้า
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  แสดง {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} จาก {filteredItems.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs">
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        title={editingItem ? `ตั้งค่าพารามิเตอร์ — ${editingItem.product_name_th || editingItem.product_name_en}` : 'ตั้งค่าพารามิเตอร์รายการ'}
      >
        <SettingsModalContent
          editingItem={editingItem}
          editParams={editParams}
          setEditParams={setEditParams}
          calcROP={calcROP}
          calcEOQ={calcEOQ}
          saving={saving}
          onClose={closeSettingsModal}
          onSave={saveSettings}
        />
      </Modal>
    </div>
  );
}
