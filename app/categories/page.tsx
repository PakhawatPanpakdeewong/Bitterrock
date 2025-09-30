'use client'

import { useState, useEffect } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

type CategoryFormData = {
  category_name: string;
  description: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<{
    source?: string;
    message?: string;
    available_tables?: string[];
    columns?: string[];
  }>({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states
  const [formData, setFormData] = useState<CategoryFormData>({
    category_name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCategories(Array.isArray(data.data) ? data.data : []);
        setApiInfo({
          source: data.source,
          message: data.message,
          available_tables: data.available_tables,
          columns: data.columns
        });
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CategoryFormData> = {};
    
    if (!formData.category_name.trim()) {
      errors.category_name = 'ชื่อประเภทสินค้าจำเป็นต้องกรอก';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      category_name: '',
      description: ''
    });
    setFormErrors({});
  };

  const handleAddCategory = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setIsAddModalOpen(false);
        resetForm();
        await fetchCategories();
        setError(null);
      } else {
        setError(result.error || 'Failed to create category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!validateForm() || !editingCategory) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: editingCategory.category_id,
          ...formData,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setIsEditModalOpen(false);
        setEditingCategory(null);
        resetForm();
        await fetchCategories();
        setError(null);
      } else {
        setError(result.error || 'Failed to update category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/categories?id=${deletingCategory.category_id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setIsDeleteModalOpen(false);
        setDeletingCategory(null);
        await fetchCategories();
        setError(null);
      } else {
        setError(result.error || 'Failed to delete category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || ''
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    resetForm();
  };

  const formatThaiDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      
      // Thai month names
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      // Get Thai Buddhist year (add 543 to Gregorian year)
      const thaiYear = date.getFullYear() + 543;
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day} ${month} ${thaiYear} (${hours}.${minutes} น.)`;
    } catch (error) {
      // Fallback to original string if parsing fails
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
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
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
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
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            เพิ่มประเภทสินค้า
          </Button>
          <Button 
            onClick={fetchCategories}
            variant="outline"
          >
            รีเฟรชข้อมูล
          </Button>
          <Button 
            onClick={() => setIsEditMode((prev) => !prev)}
            variant={isEditMode ? 'secondary' : 'outline'}
          >
            {isEditMode ? 'ยกเลิกโหมดแก้ไข' : 'โหมดแก้ไข'}
          </Button>
        </div>
      </div>

      {isEditMode && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
          คลิกแถวรายการเพื่อแก้ไขข้อมูลประเภทสินค้า
        </div>
      )}

      {/* API Information Card */}
      {apiInfo.source && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">ข้อมูลการเชื่อมต่อฐานข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>แหล่งข้อมูล:</strong> {apiInfo.source}</p>
              {apiInfo.message && <p><strong>ข้อความ:</strong> {apiInfo.message}</p>}
              {apiInfo.columns && (
                <p><strong>คอลัมน์:</strong> {apiInfo.columns.join(', ')}</p>
              )}
              {apiInfo.available_tables && (
                <p><strong>ตารางที่มี:</strong> {apiInfo.available_tables.join(', ')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <THead>
                <TR>
                  <TH>รหัสประเภท</TH>
                  <TH>ชื่อประเภท</TH>
                  <TH>คำอธิบาย</TH>
                  <TH>วันที่สร้าง</TH>
                </TR>
              </THead>
              <TBody>
                {categories.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-gray-500 py-8">
                      ไม่พบข้อมูลประเภทสินค้า
                    </TD>
                  </TR>
                ) : (
                  categories.map((category) => (
                    <TR 
                      key={category.category_id}
                      onClick={() => { if (isEditMode) openEditModal(category); }}
                      className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                    >
                      <TD>{category.category_id}</TD>
                      <TD>{category.category_name}</TD>
                      <TD>{category.description}</TD>
                      <TD>{formatThaiDate(category.created_date)}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        title="เพิ่มประเภทสินค้าใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="category_name">ชื่อประเภทสินค้า *</Label>
            <Input
              id="category_name"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              placeholder="กรอกชื่อประเภทสินค้า"
              className={formErrors.category_name ? 'border-red-500' : ''}
            />
            {formErrors.category_name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.category_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="กรอกคำอธิบายประเภทสินค้า"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        title="แก้ไขประเภทสินค้า"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_category_name">ชื่อประเภทสินค้า *</Label>
            <Input
              id="edit_category_name"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              placeholder="กรอกชื่อประเภทสินค้า"
              className={formErrors.category_name ? 'border-red-500' : ''}
            />
            {formErrors.category_name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.category_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_description">คำอธิบาย</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="กรอกคำอธิบายประเภทสินค้า"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (!editingCategory) return;
                setIsEditModalOpen(false);
                setDeletingCategory(editingCategory);
                setIsDeleteModalOpen(true);
              }}
            >
              ลบ
            </Button>
            <Button 
              onClick={handleEditCategory}
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Category Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        title="ยืนยันการลบประเภทสินค้า"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบประเภทสินค้า <strong>"{deletingCategory?.category_name}"</strong>?
          </p>
          <p className="text-sm text-red-600">
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
