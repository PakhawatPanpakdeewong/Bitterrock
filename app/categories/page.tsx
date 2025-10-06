'use client'

import { useState, useEffect } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

type Category = {
  category_id: number;
  category_name: string;
  description: string;
  created_date: string;
};

type ApiResponse = {
  success: boolean;
  data: Category[] | Category;
  source?: string;
  message?: string;
  available_tables?: string[];
  columns?: string[];
  error?: string;
  details?: string;
};

type SubCategoryFormData = {
  sub_category_id: string;
  category_id: string;
  sub_category_name: string;
  description: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Subcategories state and filter
  const [subCategories, setSubCategories] = useState<Array<{
    sub_category_id: string;
    sub_category_name: string;
    description: string | null;
    category_id: number | null;
    category_name: string | null;
  }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [subLoading, setSubLoading] = useState<boolean>(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Modal states for subcategories
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [isEditSubModalOpen, setIsEditSubModalOpen] = useState(false);
  const [isDeleteSubModalOpen, setIsDeleteSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<any>(null);

  // Form states for subcategories
  const [subFormData, setSubFormData] = useState<SubCategoryFormData>({
    sub_category_id: '',
    category_id: '',
    sub_category_name: '',
    description: ''
  });
  const [subFormErrors, setSubFormErrors] = useState<Partial<SubCategoryFormData>>({});
  const [isSubSubmitting, setIsSubSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories(selectedCategoryId);
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCategories(Array.isArray(data.data) ? data.data : []);
        // After categories are loaded, also load subcategories (unfiltered)
        await fetchSubCategories('all');
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    try {
      setSubLoading(true);
      setSubError(null);
      const url = categoryId && categoryId !== 'all' 
        ? `/api/sub_categories?category_id=${encodeURIComponent(categoryId)}` 
        : '/api/sub_categories';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSubCategories(Array.isArray(json.data) ? json.data : []);
      } else {
        setSubError(json.error || 'Failed to fetch subcategories');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubLoading(false);
    }
  };

  const validateSubForm = (): boolean => {
    const errors: Partial<SubCategoryFormData> = {};
    
    if (!subFormData.sub_category_id.trim()) {
      errors.sub_category_id = 'รหัสหมวดย่อยจำเป็นต้องกรอก';
    } else if (subFormData.sub_category_id.trim().length !== 3) {
      errors.sub_category_id = 'รหัสหมวดย่อยต้องมี 3 ตัวอักษร';
    }
    
    if (!subFormData.category_id) {
      errors.category_id = 'ประเภทหลักจำเป็นต้องเลือก';
    }
    
    if (!subFormData.sub_category_name.trim()) {
      errors.sub_category_name = 'ชื่อหมวดย่อยจำเป็นต้องกรอก';
    }
    
    if (!subFormData.description.trim()) {
      errors.description = 'คำอธิบายจำเป็นต้องกรอก';
    }
    
    setSubFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetSubForm = () => {
    setSubFormData({
      sub_category_id: '',
      category_id: '',
      sub_category_name: '',
      description: ''
    });
    setSubFormErrors({});
  };

  const handleAddSubcategory = async () => {
    if (!validateSubForm()) return;

    setIsSubSubmitting(true);
    try {
      const response = await fetch('/api/sub_categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subFormData),
      });

      const result = await response.json();

      if (result.success) {
        setIsAddSubModalOpen(false);
        resetSubForm();
        await fetchSubCategories(selectedCategoryId);
        setSubError(null);
      } else {
        setSubError(result.error || 'Failed to create subcategory');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubSubmitting(false);
    }
  };

  const handleEditSubcategory = async () => {
    if (!validateSubForm() || !editingSubcategory) return;

    setIsSubSubmitting(true);
    try {
      const response = await fetch('/api/sub_categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subFormData),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditSubModalOpen(false);
        setEditingSubcategory(null);
        resetSubForm();
        await fetchSubCategories(selectedCategoryId);
        setSubError(null);
      } else {
        setSubError(result.error || 'Failed to update subcategory');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubSubmitting(false);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!deletingSubcategory) return;

    setIsSubSubmitting(true);
    try {
      const response = await fetch(`/api/sub_categories?id=${deletingSubcategory.sub_category_id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsDeleteSubModalOpen(false);
        setDeletingSubcategory(null);
        await fetchSubCategories(selectedCategoryId);
        setSubError(null);
      } else {
        setSubError(result.error || 'Failed to delete subcategory');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubSubmitting(false);
    }
  };

  const openEditSubModal = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setSubFormData({
      sub_category_id: subcategory.sub_category_id,
      category_id: String(subcategory.category_id),
      sub_category_name: subcategory.sub_category_name,
      description: subcategory.description || ''
    });
    setSubFormErrors({});
    setIsEditSubModalOpen(true);
  };

  const openDeleteSubModal = (subcategory: any) => {
    setDeletingSubcategory(subcategory);
    setIsDeleteSubModalOpen(true);
  };

  const closeSubModals = () => {
    setIsAddSubModalOpen(false);
    setIsEditSubModalOpen(false);
    setIsDeleteSubModalOpen(false);
    setEditingSubcategory(null);
    setDeletingSubcategory(null);
    resetSubForm();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">ประเภทของสินค้า</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">กำลังโหลดข้อมูล...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">ประเภทของสินค้า</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
              <p className="mb-4">{error}</p>
              <Button onClick={fetchCategories}>
                ลองใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ประเภทของสินค้า</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddSubModalOpen(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            เพิ่มหมวดย่อย
          </Button>
          <Button 
            onClick={() => setIsEditMode((prev) => !prev)}
            variant={isEditMode ? 'secondary' : 'outline'}
          >
            {isEditMode ? 'ยกเลิกโหมดแก้ไข' : 'โหมดแก้ไข'}
          </Button>
        </div>
      </div>

      {/* Subcategories Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">หมวดย่อย (Subcategories)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="category-filter">กรองตามประเภท</Label>
              <Select value={selectedCategoryId} onValueChange={(value: string) => setSelectedCategoryId(value)}>
                <SelectTrigger id="category-filter" className="w-[260px]">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => fetchSubCategories(selectedCategoryId)}>
              รีเฟรช
            </Button>
          </div>

          {subLoading ? (
            <div className="text-sm text-gray-600">กำลังโหลดหมวดย่อย...</div>
          ) : subError ? (
            <div className="text-sm text-red-600">{subError}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <THead>
                  <TR>
                    <TH>รหัสย่อย</TH>
                    <TH>ชื่อหมวดย่อย</TH>
                    <TH>ประเภทหลัก</TH>
                    <TH>คำอธิบาย</TH>
                  </TR>
                </THead>
                <TBody>
                  {subCategories.length === 0 ? (
                    <TR>
                      <TD colSpan={4} className="text-center text-gray-500 py-8">
                        ไม่พบข้อมูลหมวดย่อย
                      </TD>
                    </TR>
                  ) : (
                  subCategories.map((sc) => (
                    <TR 
                      key={sc.sub_category_id}
                      onClick={() => { if (isEditMode) openEditSubModal(sc); }}
                      className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                    >
                      <TD>{sc.sub_category_id}</TD>
                      <TD>{sc.sub_category_name}</TD>
                      <TD>{sc.category_name}</TD>
                      <TD>{sc.description}</TD>
                    </TR>
                  ))
                  )}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditMode && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
          คลิกแถวรายการเพื่อแก้ไขข้อมูลหมวดย่อย
        </div>
      )}

      {/* Add Subcategory Modal */}
      <Modal
        isOpen={isAddSubModalOpen}
        onClose={closeSubModals}
        title="เพิ่มหมวดย่อยใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="sub_category_id">รหัสหมวดย่อย (3 ตัวอักษร) *</Label>
            <Input
              id="sub_category_id"
              value={subFormData.sub_category_id}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_id: e.target.value.toUpperCase() })}
              placeholder="เช่น BBR, DIA, HMT"
              maxLength={3}
              className={subFormErrors.sub_category_id ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_id && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="category_id">ประเภทหลัก *</Label>
            <Select 
              value={subFormData.category_id} 
              onValueChange={(value: string) => setSubFormData({ ...subFormData, category_id: value })}
            >
              <SelectTrigger className={subFormErrors.category_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกประเภทหลัก" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category_id} value={String(c.category_id)}>
                    {c.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subFormErrors.category_id && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.category_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sub_category_name">ชื่อหมวดย่อย *</Label>
            <Input
              id="sub_category_name"
              value={subFormData.sub_category_name}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อย"
              className={subFormErrors.sub_category_name ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">คำอธิบาย *</Label>
            <Textarea
              id="description"
              value={subFormData.description}
              onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
              placeholder="กรอกคำอธิบายหมวดย่อย"
              rows={3}
              className={subFormErrors.description ? 'border-red-500' : ''}
            />
            {subFormErrors.description && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.description}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeSubModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddSubcategory}
              disabled={isSubSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Subcategory Modal */}
      <Modal
        isOpen={isEditSubModalOpen}
        onClose={closeSubModals}
        title="แก้ไขหมวดย่อย"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_sub_category_id">รหัสหมวดย่อย (ไม่สามารถแก้ไขได้)</Label>
            <Input
              id="edit_sub_category_id"
              value={subFormData.sub_category_id}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="edit_category_id">ประเภทหลัก *</Label>
            <Select 
              value={subFormData.category_id} 
              onValueChange={(value: string) => setSubFormData({ ...subFormData, category_id: value })}
            >
              <SelectTrigger className={subFormErrors.category_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกประเภทหลัก" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category_id} value={String(c.category_id)}>
                    {c.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subFormErrors.category_id && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.category_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_sub_category_name">ชื่อหมวดย่อย *</Label>
            <Input
              id="edit_sub_category_name"
              value={subFormData.sub_category_name}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อย"
              className={subFormErrors.sub_category_name ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_description">คำอธิบาย *</Label>
            <Textarea
              id="edit_description"
              value={subFormData.description}
              onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
              placeholder="กรอกคำอธิบายหมวดย่อย"
              rows={3}
              className={subFormErrors.description ? 'border-red-500' : ''}
            />
            {subFormErrors.description && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.description}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeSubModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (!editingSubcategory) return;
                setIsEditSubModalOpen(false);
                setDeletingSubcategory(editingSubcategory);
                setIsDeleteSubModalOpen(true);
              }}
            >
              ลบ
            </Button>
            <Button 
              onClick={handleEditSubcategory}
              disabled={isSubSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Subcategory Modal */}
      <Modal
        isOpen={isDeleteSubModalOpen}
        onClose={closeSubModals}
        title="ยืนยันการลบหมวดย่อย"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบหมวดย่อย <strong>"{deletingSubcategory?.sub_category_name}"</strong> (รหัส: {deletingSubcategory?.sub_category_id})?
          </p>
          <p className="text-sm text-red-600">
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeSubModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSubcategory}
              disabled={isSubSubmitting}
            >
              {isSubSubmitting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

