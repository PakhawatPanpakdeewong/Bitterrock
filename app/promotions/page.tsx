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
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Tag,
  Percent,
  Calendar,
  Hash,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';

type Discount = {
  discount_id: number;
  discount_code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_date: string;
};

type FormData = {
  discount_code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: string;
  minimum_order_amount: string;
  maximum_discount_amount: string;
  start_date: string;
  end_date: string;
  usage_limit: string;
  is_active: boolean;
};

const emptyForm: FormData = {
  discount_code: '',
  discount_type: 'percentage',
  discount_value: '',
  minimum_order_amount: '0',
  maximum_discount_amount: '',
  start_date: '',
  end_date: '',
  usage_limit: '',
  is_active: true,
};

export default function PromotionsPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', String(itemsPerPage));
      params.set('offset', String((currentPage - 1) * itemsPerPage));
      if (searchTerm) params.set('search', searchTerm);
      if (filterActive === 'true') params.set('is_active', 'true');
      if (filterActive === 'false') params.set('is_active', 'false');

      const res = await fetch(`/api/discounts?${params}`);
      const data = await res.json();

      if (data.ok) {
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filterActive]);

  const validateForm = (): boolean => {
    const err: Partial<Record<keyof FormData, string>> = {};
    if (!formData.discount_code.trim()) err.discount_code = 'กรุณากรอกรหัสโปรโมชั่น';
    if (!formData.discount_value) err.discount_value = 'กรุณากรอกมูลค่าส่วนลด';
    else if (Number(formData.discount_value) <= 0) err.discount_value = 'มูลค่าต้องมากกว่า 0';
    if (formData.discount_type === 'percentage' && Number(formData.discount_value) > 100) {
      err.discount_value = 'เปอร์เซ็นต์ต้องไม่เกิน 100';
    }
    if (Number(formData.minimum_order_amount) < 0) {
      err.minimum_order_amount = 'ยอดขั้นต่ำต้องไม่เป็นค่าติดลบ';
    }
    if (!formData.start_date) err.start_date = 'กรุณาเลือกวันเริ่มต้น';
    if (!formData.end_date) err.end_date = 'กรุณาเลือกวันสิ้นสุด';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      err.end_date = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น';
    }
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_code: formData.discount_code.trim().toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          minimum_order_amount: Number(formData.minimum_order_amount) || 0,
          maximum_discount_amount: formData.maximum_discount_amount
            ? Number(formData.maximum_discount_amount)
            : null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          is_active: formData.is_active,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAddModalOpen(false);
        setFormData(emptyForm);
        setFormErrors({});
        fetchData();
      } else {
        setFormErrors({ discount_code: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (error) {
      console.error('Error adding discount:', error);
      setFormErrors({ discount_code: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_id: selectedItem.discount_id,
          discount_code: formData.discount_code.trim().toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          minimum_order_amount: Number(formData.minimum_order_amount) || 0,
          maximum_discount_amount: formData.maximum_discount_amount
            ? Number(formData.maximum_discount_amount)
            : null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          is_active: formData.is_active,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsEditModalOpen(false);
        setSelectedItem(null);
        setFormData(emptyForm);
        setFormErrors({});
        fetchData();
      } else {
        setFormErrors({ discount_code: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      setFormErrors({ discount_code: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/discounts?id=${selectedItem.discount_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        fetchData();
      } else {
        alert(data.error || 'ไม่สามารถลบได้');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (item: Discount) => {
    setSelectedItem(item);
    setFormData({
      discount_code: item.discount_code,
      discount_type: item.discount_type as 'percentage' | 'fixed_amount',
      discount_value: String(item.discount_value),
      minimum_order_amount: String(item.minimum_order_amount),
      maximum_discount_amount: item.maximum_discount_amount != null ? String(item.maximum_discount_amount) : '',
      start_date: item.start_date.slice(0, 16),
      end_date: item.end_date.slice(0, 16),
      usage_limit: item.usage_limit != null ? String(item.usage_limit) : '',
      is_active: item.is_active,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: Discount) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">โปรโมชั่นและการลดราคา</h1>
          <p className="text-sm text-gray-600">จัดการรหัสส่วนลดและโปรโมชั่นต่างๆ</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              รายการโปรโมชั่น
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ค้นหารหัสโปรโมชั่น..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={filterActive} onValueChange={(v: string) => { setFilterActive(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="true">ใช้งาน</SelectItem>
                  <SelectItem value="false">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={() => { setFormData(emptyForm); setFormErrors({}); setIsAddModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มโปรโมชั่น
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">กำลังโหลด...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">ไม่พบโปรโมชั่น</div>
            ) : (
              <>
                <Table>
                  <THead>
                    <TR>
                      <TH>รหัส</TH>
                      <TH>มูลค่า</TH>
                      <TH>ยอดขั้นต่ำ</TH>
                      <TH>วันเริ่ม-สิ้นสุด</TH>
                      <TH>ใช้แล้ว/จำกัด</TH>
                      <TH>สถานะ</TH>
                      <TH className="text-right">จัดการ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {items.map((item) => (
                      <TR key={item.discount_id}>
                        <TD className="font-mono font-medium">{item.discount_code}</TD>
                        <TD>
                          {item.discount_type === 'percentage'
                            ? `${formatCurrency(item.discount_value)}%`
                            : `฿${formatCurrency(item.discount_value)}`}
                        </TD>
                        <TD>฿{formatCurrency(item.minimum_order_amount)}</TD>
                        <TD className="text-xs">
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </TD>
                        <TD>
                          {item.used_count}
                          {item.usage_limit != null ? ` / ${item.usage_limit}` : ' / ∞'}
                        </TD>
                        <TD>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteModal(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} จาก {total} รายการ
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        ก่อนหน้า
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        ถัดไป
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setFormData(emptyForm); setFormErrors({}); }}
        title="เพิ่มโปรโมชั่น"
        className="max-w-lg"
      >
        <PromoForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleAdd}
          onCancel={() => { setIsAddModalOpen(false); setFormData(emptyForm); setFormErrors({}); }}
          submitting={submitting}
          submitLabel="เพิ่มโปรโมชั่น"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedItem(null); setFormData(emptyForm); setFormErrors({}); }}
        title="แก้ไขโปรโมชั่น"
        className="max-w-lg"
      >
        <PromoForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleEdit}
          onCancel={() => { setIsEditModalOpen(false); setSelectedItem(null); setFormData(emptyForm); setFormErrors({}); }}
          submitting={submitting}
          submitLabel="บันทึก"
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedItem(null); }}
        title="ยืนยันการลบ"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            คุณต้องการลบโปรโมชั่น <strong>{selectedItem?.discount_code}</strong> ใช่หรือไม่?
          </p>
          <p className="text-sm text-amber-600">
            โปรโมชั่นที่ถูกใช้งานในออเดอร์แล้วจะไม่สามารถลบได้
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PromoForm({
  formData,
  setFormData,
  formErrors,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  formData: FormData;
  setFormData: (d: FormData | ((p: FormData) => FormData)) => void;
  formErrors: Partial<Record<keyof FormData, string>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <Label>รหัสโปรโมชั่น *</Label>
        <Input
          value={formData.discount_code}
          onChange={(e) => setFormData((p) => ({ ...p, discount_code: e.target.value.toUpperCase() }))}
          placeholder="เช่น SAVE20"
          className={formErrors.discount_code ? 'border-red-500' : ''}
        />
        {formErrors.discount_code && (
          <p className="text-sm text-red-500 mt-1">{formErrors.discount_code}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>ประเภท *</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(v: string) => setFormData((p) => ({ ...p, discount_type: v as 'percentage' | 'fixed_amount' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">เปอร์เซ็นต์ (%)</SelectItem>
              <SelectItem value="fixed_amount">จำนวนเงิน (฿)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>มูลค่าส่วนลด *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.discount_value}
            onChange={(e) => setFormData((p) => ({ ...p, discount_value: e.target.value }))}
            placeholder={formData.discount_type === 'percentage' ? 'เช่น 20' : 'เช่น 100'}
            className={formErrors.discount_value ? 'border-red-500' : ''}
          />
          {formErrors.discount_value && (
            <p className="text-sm text-red-500 mt-1">{formErrors.discount_value}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>ยอดสั่งซื้อขั้นต่ำ (฿)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.minimum_order_amount}
            onChange={(e) => setFormData((p) => ({ ...p, minimum_order_amount: e.target.value }))}
            placeholder="0"
            className={formErrors.minimum_order_amount ? 'border-red-500' : ''}
          />
          {formErrors.minimum_order_amount && (
            <p className="text-sm text-red-500 mt-1">{formErrors.minimum_order_amount}</p>
          )}
        </div>
        <div>
          <Label>ส่วนลดสูงสุด (฿) - สำหรับเปอร์เซ็นต์</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.maximum_discount_amount}
            onChange={(e) => setFormData((p) => ({ ...p, maximum_discount_amount: e.target.value }))}
            placeholder="ไม่จำกัด"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>วันเริ่มต้น *</Label>
          <Input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
            className={formErrors.start_date ? 'border-red-500' : ''}
          />
          {formErrors.start_date && (
            <p className="text-sm text-red-500 mt-1">{formErrors.start_date}</p>
          )}
        </div>
        <div>
          <Label>วันสิ้นสุด *</Label>
          <Input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
            className={formErrors.end_date ? 'border-red-500' : ''}
          />
          {formErrors.end_date && (
            <p className="text-sm text-red-500 mt-1">{formErrors.end_date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>จำนวนครั้งที่ใช้ได้ (เว้นว่าง = ไม่จำกัด)</Label>
          <Input
            type="number"
            min="0"
            value={formData.usage_limit}
            onChange={(e) => setFormData((p) => ({ ...p, usage_limit: e.target.value }))}
            placeholder="ไม่จำกัด"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">เปิดใช้งาน</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
