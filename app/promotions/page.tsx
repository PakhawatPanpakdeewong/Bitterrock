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
import { useNotification } from '@/components/ui/notification';
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
  const { notify } = useNotification();
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
        notify(data.error || 'ไม่สามารถลบได้', { type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      notify('เกิดข้อผิดพลาด กรุณาลองใหม่', { type: 'error' });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              โปรโมชั่นและการลดราคา
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              จัดการโค้ดส่วนลดและแคมเปญโปรโมชั่นสำหรับร้านของคุณ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => {
                setFormData(emptyForm);
                setFormErrors({});
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              เพิ่มโปรโมชั่นใหม่
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                    รายการโปรโมชั่นทั้งหมด
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    สร้าง แก้ไข และติดตามการใช้งานรหัสส่วนลด
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500 border border-dashed border-slate-200 rounded-full px-3 py-1">
                  ใช้งานอยู่ {items.filter((i) => i.is_active).length} รายการ
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="ค้นหารหัสโปรโมชั่น หรือชื่อโค้ด..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 bg-slate-50/60 border-slate-200 focus:bg-white"
                  />
                </div>
                <Select
                  value={filterActive}
                  onValueChange={(v: string) => {
                    setFilterActive(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32 bg-slate-50/60 border-slate-200">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="true">ใช้งาน</SelectItem>
                    <SelectItem value="false">ปิดใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>ใช้งาน</span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                  <span>ปิดใช้งาน</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="py-14 flex flex-col items-center justify-center text-slate-500">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                </div>
                <p className="text-sm font-medium">กำลังโหลดข้อมูลโปรโมชั่น...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-800">ยังไม่มีโปรโมชั่น</p>
                <p className="mt-1 text-xs text-slate-500">
                  เริ่มต้นสร้างโค้ดส่วนลดชุดแรกเพื่อกระตุ้นการสั่งซื้อ
                </p>
                <Button
                  className="mt-4 gap-1"
                  size="sm"
                  onClick={() => {
                    setFormData(emptyForm);
                    setFormErrors({});
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มโปรโมชั่น
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <Table>
                    <THead>
                      <TR className="bg-slate-50/80">
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          รหัส
                        </TH>
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          มูลค่าส่วนลด
                        </TH>
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          ยอดขั้นต่ำ
                        </TH>
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          วันเริ่ม - สิ้นสุด
                        </TH>
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          ใช้แล้ว / จำกัด
                        </TH>
                        <TH className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          สถานะ
                        </TH>
                        <TH className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide">
                          จัดการ
                        </TH>
                      </TR>
                    </THead>
                    <TBody>
                      {items.map((item) => {
                        const isExpired = new Date(item.end_date) < new Date();
                        const isNearlyFull =
                          item.usage_limit != null &&
                          item.usage_limit > 0 &&
                          item.used_count / item.usage_limit >= 0.8;

                        return (
                          <TR
                            key={item.discount_id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <TD className="align-middle">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                  {item.discount_code}
                                </span>
                                <span className="text-[0.7rem] text-slate-500">
                                  สร้างเมื่อ {formatDate(item.created_date)}
                                </span>
                              </div>
                            </TD>
                            <TD className="align-middle">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  <Percent className="w-3 h-3" />
                                  {item.discount_type === 'percentage'
                                    ? `${formatCurrency(item.discount_value)}%`
                                    : `฿${formatCurrency(item.discount_value)}`}
                                </span>
                                {item.maximum_discount_amount != null && (
                                  <span className="text-[0.7rem] text-slate-500">
                                    สูงสุด ฿{formatCurrency(item.maximum_discount_amount)}
                                  </span>
                                )}
                              </div>
                            </TD>
                            <TD className="align-middle text-sm text-slate-800">
                              ฿{formatCurrency(item.minimum_order_amount)}
                            </TD>
                            <TD className="align-middle text-xs text-slate-700">
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {formatDate(item.start_date)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {formatDate(item.end_date)}
                                </span>
                              </div>
                            </TD>
                            <TD className="align-middle text-sm text-slate-800">
                              <div className="flex flex-col gap-0.5">
                                <span>
                                  {item.used_count}
                                  {item.usage_limit != null ? ` / ${item.usage_limit}` : ' / ∞'}
                                </span>
                                {isNearlyFull && !isExpired && (
                                  <span className="inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-medium text-amber-700">
                                    ใกล้เต็มโควตา
                                  </span>
                                )}
                              </div>
                            </TD>
                            <TD className="align-middle">
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                                    item.is_active && !isExpired
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      item.is_active && !isExpired
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-400'
                                    }`}
                                  />
                                  {isExpired ? 'หมดอายุแล้ว' : item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                </span>
                              </div>
                            </TD>
                            <TD className="align-middle text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  onClick={() => openEditModal(item)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => openDeleteModal(item)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs md:text-sm text-slate-500">
                      แสดง {(currentPage - 1) * itemsPerPage + 1} -{' '}
                      {Math.min(currentPage * itemsPerPage, total)} จาก {total} รายการ
                    </p>
                    <div className="inline-flex items-center gap-2 self-end md:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 text-slate-700"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        ก่อนหน้า
                      </Button>
                      <span className="text-xs text-slate-500">
                        หน้า {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-200 text-slate-700"
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
