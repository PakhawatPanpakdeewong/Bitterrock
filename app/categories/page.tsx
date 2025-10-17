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

type Attribute = {
  attribute_id: number;
  attribute_name_th: string;
  attribute_name_en: string;
};

type AttributeValue = {
  attribute_value_id: string;
  attribute_id: number;
  attribute_value_th: string;
  attribute_value_en: string;
};

type AttributeFormData = {
  attribute_name_th: string;
  attribute_name_en: string;
};

type AttributeValueFormData = {
  attribute_value_id: string;
  attribute_id: string;
  attribute_value_th: string;
  attribute_value_en: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View toggle state
  const [currentView, setCurrentView] = useState<'subcategories' | 'attributes'>('subcategories');
  
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

  // Attributes state
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('all');
  const [attrLoading, setAttrLoading] = useState<boolean>(false);
  const [attrError, setAttrError] = useState<string | null>(null);

  // Modal states for subcategories
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [isEditSubModalOpen, setIsEditSubModalOpen] = useState(false);
  const [isDeleteSubModalOpen, setIsDeleteSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<any>(null);

  // Modal states for attributes
  const [isAddAttrModalOpen, setIsAddAttrModalOpen] = useState(false);
  const [isEditAttrModalOpen, setIsEditAttrModalOpen] = useState(false);
  const [isDeleteAttrModalOpen, setIsDeleteAttrModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [deletingAttribute, setDeletingAttribute] = useState<any>(null);

  // Modal states for attribute values
  const [isAddAttrValueModalOpen, setIsAddAttrValueModalOpen] = useState(false);
  const [isEditAttrValueModalOpen, setIsEditAttrValueModalOpen] = useState(false);
  const [isDeleteAttrValueModalOpen, setIsDeleteAttrValueModalOpen] = useState(false);
  const [editingAttributeValue, setEditingAttributeValue] = useState<any>(null);
  const [deletingAttributeValue, setDeletingAttributeValue] = useState<any>(null);

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

  // Form states for attributes
  const [attrFormData, setAttrFormData] = useState<AttributeFormData>({
    attribute_name_th: '',
    attribute_name_en: ''
  });
  const [attrFormErrors, setAttrFormErrors] = useState<Partial<AttributeFormData>>({});
  const [isAttrSubmitting, setIsAttrSubmitting] = useState(false);

  // Form states for attribute values
  const [attrValueFormData, setAttrValueFormData] = useState<AttributeValueFormData>({
    attribute_value_id: '',
    attribute_id: '',
    attribute_value_th: '',
    attribute_value_en: ''
  });
  const [attrValueFormErrors, setAttrValueFormErrors] = useState<Partial<AttributeValueFormData>>({});
  const [isAttrValueSubmitting, setIsAttrValueSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  useEffect(() => {
    fetchSubCategories(selectedCategoryId);
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchAttributeValues(selectedAttributeId);
  }, [selectedAttributeId]);

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

  const fetchAttributes = async () => {
    try {
      setAttrLoading(true);
      setAttrError(null);
      const response = await fetch('/api/attributes');
      const data = await response.json();
      
      if (data.ok) {
        setAttributes(Array.isArray(data.items) ? data.items : []);
      } else {
        setAttrError(data.error || 'Failed to fetch attributes');
      }
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAttrLoading(false);
    }
  };

  const fetchAttributeValues = async (attributeId: string) => {
    try {
      setAttrLoading(true);
      setAttrError(null);
      const url = attributeId && attributeId !== 'all' 
        ? `/api/attribute-values?attribute_id=${encodeURIComponent(attributeId)}` 
        : '/api/attribute-values';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAttributeValues(Array.isArray(data.data) ? data.data : []);
      } else {
        setAttrError(data.error || 'Failed to fetch attribute values');
      }
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAttrLoading(false);
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

  // Attribute Value Modal Functions
  const openEditAttrValueModal = (attributeValue: any) => {
    setEditingAttributeValue(attributeValue);
    setAttrValueFormData({
      attribute_value_id: attributeValue.attribute_value_id,
      attribute_id: String(attributeValue.attribute_id),
      attribute_value_th: attributeValue.attribute_value_th,
      attribute_value_en: attributeValue.attribute_value_en
    });
    setAttrValueFormErrors({});
    setIsEditAttrValueModalOpen(true);
  };

  const resetAttrValueForm = () => {
    setAttrValueFormData({
      attribute_value_id: '',
      attribute_id: '',
      attribute_value_th: '',
      attribute_value_en: ''
    });
    setAttrValueFormErrors({});
  };

  const closeAttrValueModals = () => {
    setIsAddAttrValueModalOpen(false);
    setIsEditAttrValueModalOpen(false);
    setIsDeleteAttrValueModalOpen(false);
    setEditingAttributeValue(null);
    setDeletingAttributeValue(null);
    resetAttrValueForm();
  };

  const validateAttrValueForm = (): boolean => {
    const errors: Partial<AttributeValueFormData> = {};
    
    if (!attrValueFormData.attribute_value_id.trim()) {
      errors.attribute_value_id = 'รหัสค่าคุณสมบัติจำเป็นต้องกรอก';
    } else if (attrValueFormData.attribute_value_id.trim().length !== 3) {
      errors.attribute_value_id = 'รหัสค่าคุณสมบัติต้องมี 3 ตัวอักษร';
    }
    
    if (!attrValueFormData.attribute_id) {
      errors.attribute_id = 'คุณสมบัติจำเป็นต้องเลือก';
    }
    
    if (!attrValueFormData.attribute_value_th.trim()) {
      errors.attribute_value_th = 'ค่าคุณสมบัติ (ไทย) จำเป็นต้องกรอก';
    }
    
    if (!attrValueFormData.attribute_value_en.trim()) {
      errors.attribute_value_en = 'ค่าคุณสมบัติ (อังกฤษ) จำเป็นต้องกรอก';
    }
    
    setAttrValueFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAttributeValue = async () => {
    if (!validateAttrValueForm()) return;

    setIsAttrValueSubmitting(true);
    try {
      const response = await fetch('/api/attribute-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attrValueFormData),
      });

      const result = await response.json();

      if (result.success) {
        setIsAddAttrValueModalOpen(false);
        resetAttrValueForm();
        await fetchAttributeValues(selectedAttributeId);
        setAttrError(null);
      } else {
        setAttrError(result.error || 'Failed to create attribute value');
      }
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAttrValueSubmitting(false);
    }
  };

  const handleEditAttributeValue = async () => {
    if (!validateAttrValueForm() || !editingAttributeValue) return;

    setIsAttrValueSubmitting(true);
    try {
      const response = await fetch('/api/attribute-values', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attrValueFormData),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditAttrValueModalOpen(false);
        setEditingAttributeValue(null);
        resetAttrValueForm();
        await fetchAttributeValues(selectedAttributeId);
        setAttrError(null);
      } else {
        setAttrError(result.error || 'Failed to update attribute value');
      }
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAttrValueSubmitting(false);
    }
  };

  const handleDeleteAttributeValue = async () => {
    if (!deletingAttributeValue) return;

    setIsAttrValueSubmitting(true);
    try {
      const response = await fetch(`/api/attribute-values?id=${deletingAttributeValue.attribute_value_id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsDeleteAttrValueModalOpen(false);
        setDeletingAttributeValue(null);
        await fetchAttributeValues(selectedAttributeId);
        setAttrError(null);
      } else {
        setAttrError(result.error || 'Failed to delete attribute value');
      }
    } catch (err) {
      setAttrError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAttrValueSubmitting(false);
    }
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
            disabled={currentView !== 'subcategories'}
          >
            เพิ่มหมวดย่อย
          </Button>
          <Button 
            onClick={() => setIsAddAttrModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600"
            disabled={currentView !== 'attributes'}
          >
            เพิ่มคุณสมบัติ
          </Button>
          <Button 
            onClick={() => setIsAddAttrValueModalOpen(true)}
            className="bg-purple-500 hover:bg-purple-600"
            disabled={currentView !== 'attributes'}
          >
            เพิ่มค่าคุณสมบัติ
          </Button>
          <Button 
            onClick={() => setIsEditMode((prev) => !prev)}
            variant={isEditMode ? 'secondary' : 'outline'}
          >
            {isEditMode ? 'ยกเลิกโหมดแก้ไข' : 'โหมดแก้ไข'}
          </Button>
        </div>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => setCurrentView('subcategories')}
          variant={currentView === 'subcategories' ? 'default' : 'outline'}
          className={currentView === 'subcategories' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          หมวดย่อย (Subcategories)
        </Button>
        <Button 
          onClick={() => setCurrentView('attributes')}
          variant={currentView === 'attributes' ? 'default' : 'outline'}
          className={currentView === 'attributes' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          ค่าคุณสมบัติ (Attribute Values)
        </Button>
      </div>

      {isEditMode && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
          คลิกแถวรายการเพื่อแก้ไขข้อมูล{currentView === 'subcategories' ? 'หมวดย่อย' : 'ค่าคุณสมบัติ'}
        </div>
      )}

      {/* Subcategories Filter */}
      {currentView === 'subcategories' && (
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
      )}

      {/* Attributes Values Filter */}
      {currentView === 'attributes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ค่าคุณสมบัติ (Attribute Values)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="attribute-filter">กรองตามคุณสมบัติ</Label>
                <Select value={selectedAttributeId} onValueChange={(value: string) => setSelectedAttributeId(value)}>
                  <SelectTrigger id="attribute-filter" className="w-[260px]">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {attributes.map((attr) => (
                      <SelectItem key={attr.attribute_id} value={String(attr.attribute_id)}>
                        {attr.attribute_name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => fetchAttributeValues(selectedAttributeId)}>
                รีเฟรช
              </Button>
            </div>

            {attrLoading ? (
              <div className="text-sm text-gray-600">กำลังโหลดค่าคุณสมบัติ...</div>
            ) : attrError ? (
              <div className="text-sm text-red-600">{attrError}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <THead>
                    <TR>
                      <TH>รหัสค่า</TH>
                      <TH>ค่าคุณสมบัติ (ไทย)</TH>
                      <TH>ค่าคุณสมบัติ (อังกฤษ)</TH>
                      <TH>คุณสมบัติ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {attributeValues.length === 0 ? (
                      <TR>
                        <TD colSpan={4} className="text-center text-gray-500 py-8">
                          ไม่พบข้อมูลค่าคุณสมบัติ
                        </TD>
                      </TR>
                    ) : (
                    attributeValues.map((av) => {
                      const attribute = attributes.find(attr => attr.attribute_id === av.attribute_id);
                      return (
                        <TR 
                          key={av.attribute_value_id}
                          onClick={() => { if (isEditMode) openEditAttrValueModal(av); }}
                          className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                        >
                          <TD>{av.attribute_value_id}</TD>
                          <TD>{av.attribute_value_th}</TD>
                          <TD>{av.attribute_value_en}</TD>
                          <TD>{attribute?.attribute_name_th || 'ไม่พบข้อมูล'}</TD>
                        </TR>
                      );
                    })
                    )}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Add Attribute Value Modal */}
      <Modal
        isOpen={isAddAttrValueModalOpen}
        onClose={closeAttrValueModals}
        title="เพิ่มค่าคุณสมบัติใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="attribute_value_id">รหัสค่าคุณสมบัติ (3 ตัวอักษร) *</Label>
            <Input
              id="attribute_value_id"
              value={attrValueFormData.attribute_value_id}
              onChange={(e) => setAttrValueFormData({ ...attrValueFormData, attribute_value_id: e.target.value.toUpperCase() })}
              placeholder="เช่น RED, BLU, SML"
              maxLength={3}
              className={attrValueFormErrors.attribute_value_id ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_id && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="attribute_id">คุณสมบัติ *</Label>
            <Select 
              value={attrValueFormData.attribute_id} 
              onValueChange={(value: string) => setAttrValueFormData({ ...attrValueFormData, attribute_id: value })}
            >
              <SelectTrigger className={attrValueFormErrors.attribute_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกคุณสมบัติ" />
              </SelectTrigger>
              <SelectContent>
                {attributes.map((attr) => (
                  <SelectItem key={attr.attribute_id} value={String(attr.attribute_id)}>
                    {attr.attribute_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {attrValueFormErrors.attribute_id && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="attribute_value_th">ค่าคุณสมบัติ (ไทย) *</Label>
            <Input
              id="attribute_value_th"
              value={attrValueFormData.attribute_value_th}
              onChange={(e) => setAttrValueFormData({ ...attrValueFormData, attribute_value_th: e.target.value })}
              placeholder="กรอกค่าคุณสมบัติภาษาไทย"
              className={attrValueFormErrors.attribute_value_th ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_th && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="attribute_value_en">ค่าคุณสมบัติ (อังกฤษ) *</Label>
            <Input
              id="attribute_value_en"
              value={attrValueFormData.attribute_value_en}
              onChange={(e) => setAttrValueFormData({ ...attrValueFormData, attribute_value_en: e.target.value })}
              placeholder="กรอกค่าคุณสมบัติภาษาอังกฤษ"
              className={attrValueFormErrors.attribute_value_en ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_en && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_en}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAttrValueModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddAttributeValue}
              disabled={isAttrValueSubmitting}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isAttrValueSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Attribute Value Modal */}
      <Modal
        isOpen={isEditAttrValueModalOpen}
        onClose={closeAttrValueModals}
        title="แก้ไขค่าคุณสมบัติ"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_attribute_value_id">รหัสค่าคุณสมบัติ (ไม่สามารถแก้ไขได้)</Label>
            <Input
              id="edit_attribute_value_id"
              value={attrValueFormData.attribute_value_id}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="edit_attribute_id">คุณสมบัติ *</Label>
            <Select 
              value={attrValueFormData.attribute_id} 
              onValueChange={(value: string) => setAttrValueFormData({ ...attrValueFormData, attribute_id: value })}
            >
              <SelectTrigger className={attrValueFormErrors.attribute_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกคุณสมบัติ" />
              </SelectTrigger>
              <SelectContent>
                {attributes.map((attr) => (
                  <SelectItem key={attr.attribute_id} value={String(attr.attribute_id)}>
                    {attr.attribute_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {attrValueFormErrors.attribute_id && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_attribute_value_th">ค่าคุณสมบัติ (ไทย) *</Label>
            <Input
              id="edit_attribute_value_th"
              value={attrValueFormData.attribute_value_th}
              onChange={(e) => setAttrValueFormData({ ...attrValueFormData, attribute_value_th: e.target.value })}
              placeholder="กรอกค่าคุณสมบัติภาษาไทย"
              className={attrValueFormErrors.attribute_value_th ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_th && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_attribute_value_en">ค่าคุณสมบัติ (อังกฤษ) *</Label>
            <Input
              id="edit_attribute_value_en"
              value={attrValueFormData.attribute_value_en}
              onChange={(e) => setAttrValueFormData({ ...attrValueFormData, attribute_value_en: e.target.value })}
              placeholder="กรอกค่าคุณสมบัติภาษาอังกฤษ"
              className={attrValueFormErrors.attribute_value_en ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_en && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_en}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAttrValueModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (!editingAttributeValue) return;
                setIsEditAttrValueModalOpen(false);
                setDeletingAttributeValue(editingAttributeValue);
                setIsDeleteAttrValueModalOpen(true);
              }}
            >
              ลบ
            </Button>
            <Button 
              onClick={handleEditAttributeValue}
              disabled={isAttrValueSubmitting}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isAttrValueSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Attribute Value Modal */}
      <Modal
        isOpen={isDeleteAttrValueModalOpen}
        onClose={closeAttrValueModals}
        title="ยืนยันการลบค่าคุณสมบัติ"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบค่าคุณสมบัติ <strong>"{deletingAttributeValue?.attribute_value_th}"</strong> (รหัส: {deletingAttributeValue?.attribute_value_id})?
          </p>
          <p className="text-sm text-red-600">
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAttrValueModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAttributeValue}
              disabled={isAttrValueSubmitting}
            >
              {isAttrValueSubmitting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

