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
import { 
  Tag,
  Grid,
  Package,
  Square,
  Filter,
  RefreshCw,
  Upload,
  Plus
} from 'lucide-react';

type Category = {
  category_id: number;
  category_name: string;
  category_name_th?: string;
  category_name_en?: string;
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
  category_id: string;
  sub_category_name_th: string;
  sub_category_name_en: string;
};

type Attribute = {
  attribute_id: number;
  attribute_name_th: string;
  attribute_name_en: string;
};

type AttributeValue = {
  attribute_value_id: number;
  attribute_id: number;
  attribute_value_th: string;
  attribute_value_en: string;
};

type AttributeFormData = {
  attribute_name_th: string;
  attribute_name_en: string;
};

type AttributeValueFormData = {
  attribute_id: string;
  attribute_value_th: string;
  attribute_value_en: string;
};

type ProductVariantFormData = {
  category_id: string;
  sub_category_id: string;
  product_id: string;
  attribute_id: string;
  attribute_value_id: string;
  sku: string;
  price: string;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View toggle state - support 5 views
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'products' | 'attributes' | 'attributeValues'>('categories');
  
  // Products state (for product list) and variants state (for diversity view)
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantsLoading, setVariantsLoading] = useState<boolean>(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [isDeleteVariantModalOpen, setIsDeleteVariantModalOpen] = useState(false);
  
  // Subcategories state and filter
  const [subCategories, setSubCategories] = useState<Array<{
    sub_category_id: number;
    sub_category_name_th: string;
    sub_category_name_en: string;
    category_id: number | null;
    category_name_th?: string | null;
    category_name_en?: string | null;
    category_name?: string | null;
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
    category_id: '',
    sub_category_name_th: '',
    sub_category_name_en: ''
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
    attribute_id: '',
    attribute_value_th: '',
    attribute_value_en: ''
  });
  const [attrValueFormErrors, setAttrValueFormErrors] = useState<Partial<AttributeValueFormData>>({});
  const [isAttrValueSubmitting, setIsAttrValueSubmitting] = useState(false);

  // Modal states for product variants
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [variantFormData, setVariantFormData] = useState<ProductVariantFormData>({
    category_id: '',
    sub_category_id: '',
    product_id: '',
    attribute_id: '',
    attribute_value_id: '',
    sku: '',
    price: '',
    is_active: true
  });
  const [variantFormErrors, setVariantFormErrors] = useState<Partial<ProductVariantFormData>>({});
  const [isVariantSubmitting, setIsVariantSubmitting] = useState(false);
  
  // Filtered data for variant form
  const filteredSubCategoriesForVariant = variantFormData.category_id
    ? subCategories.filter(sc => sc.category_id === Number(variantFormData.category_id))
    : [];
  
  const filteredProductsForVariant = variantFormData.sub_category_id
    ? products.filter(p => p.sub_category_id === Number(variantFormData.sub_category_id))
    : [];
  
  const filteredAttributeValuesForVariant = variantFormData.attribute_id
    ? attributeValues.filter(av => av.attribute_id === Number(variantFormData.attribute_id))
    : [];

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchAllSubCategories();
    fetchAllAttributeValues();
    fetchAllProducts();
    fetchAllVariants();
  }, []);

  useEffect(() => {
    if (currentView === 'subcategories') {
      fetchSubCategories(selectedCategoryId);
    }
  }, [selectedCategoryId, currentView]);

  useEffect(() => {
    if (currentView === 'attributeValues') {
      fetchAttributeValues(selectedAttributeId);
    }
  }, [selectedAttributeId, currentView]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCategories(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubCategories = async () => {
    try {
      const res = await fetch('/api/sub_categories');
      const json = await res.json();
      if (json.success) {
        setSubCategories(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      // Silent fail for count
    }
  };

  const fetchAllAttributeValues = async () => {
    try {
      const response = await fetch('/api/attribute-values');
      const data = await response.json();
      if (data.success) {
        setAttributeValues(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      // Silent fail for count
    }
  };

  const fetchAllProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/products?limit=10000');
      const data = await response.json();
      if (data.ok) {
        setProducts(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAllVariants = async () => {
    try {
      setVariantsLoading(true);
      const response = await fetch('/api/product-variants?limit=10000');
      const data = await response.json();
      if (data.ok) {
        setVariants(Array.isArray(data.items) ? data.items : []);
      } else {
        setVariants([]);
      }
    } catch (err) {
      setVariantsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setVariantsLoading(false);
    }
  };

  // Format date in Thai format
  const formatThaiDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear() + 543; // Convert to Buddhist Era
    return `${day}/${month}/${year}`;
  };

  // Refresh all data
  const handleRefresh = async () => {
    await Promise.all([
      fetchCategories(),
      fetchAttributes(),
      fetchAllSubCategories(),
      fetchAllAttributeValues(),
      fetchAllProducts()
    ]);
  };

  // Export data function
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
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
    
    if (!subFormData.category_id) {
      errors.category_id = 'ประเภทหลักจำเป็นต้องเลือก';
    }
    
    if (!subFormData.sub_category_name_th.trim()) {
      errors.sub_category_name_th = 'ชื่อหมวดย่อย (ไทย) จำเป็นต้องกรอก';
    }
    
    if (!subFormData.sub_category_name_en.trim()) {
      errors.sub_category_name_en = 'ชื่อหมวดย่อย (อังกฤษ) จำเป็นต้องกรอก';
    }
    
    setSubFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetSubForm = () => {
    setSubFormData({
      category_id: '',
      sub_category_name_th: '',
      sub_category_name_en: ''
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
        body: JSON.stringify({
          sub_category_id: editingSubcategory.sub_category_id,
          ...subFormData
        }),
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
      category_id: String(subcategory.category_id),
      sub_category_name_th: subcategory.sub_category_name_th || '',
      sub_category_name_en: subcategory.sub_category_name_en || ''
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
      attribute_id: String(attributeValue.attribute_id),
      attribute_value_th: attributeValue.attribute_value_th,
      attribute_value_en: attributeValue.attribute_value_en
    });
    setAttrValueFormErrors({});
    setIsEditAttrValueModalOpen(true);
  };

  const resetAttrValueForm = () => {
    setAttrValueFormData({
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

  // Product Variant Functions
  const validateVariantForm = (): boolean => {
    const errors: Partial<ProductVariantFormData> = {};
    
    if (!variantFormData.category_id) {
      errors.category_id = 'ประเภทสินค้าจำเป็นต้องเลือก';
    }
    
    if (!variantFormData.sub_category_id) {
      errors.sub_category_id = 'หมวดหมู่ย่อยจำเป็นต้องเลือก';
    }
    
    if (!variantFormData.product_id) {
      errors.product_id = 'สินค้าจำเป็นต้องเลือก';
    }
    
    if (!variantFormData.attribute_id) {
      errors.attribute_id = 'คุณสมบัติหลักจำเป็นต้องเลือก';
    }
    
    if (!variantFormData.attribute_value_id) {
      errors.attribute_value_id = 'ค่าคุณสมบัติจำเป็นต้องเลือก';
    }
    
    // SKU validation: exactly 3 uppercase English letters (A-Z)
    const skuPattern = /^[A-Z]{3}$/;
    if (!variantFormData.sku.trim()) {
      errors.sku = 'SKU จำเป็นต้องกรอก';
    } else if (!skuPattern.test(variantFormData.sku.trim())) {
      errors.sku = 'SKU ต้องเป็นตัวอักษรภาษาอังกฤษ 3 ตัว (A-Z) เท่านั้น';
    }
    
    if (!variantFormData.price.trim() || isNaN(Number(variantFormData.price)) || Number(variantFormData.price) < 0) {
      errors.price = 'ราคาจำเป็นต้องกรอกและต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0';
    }
    
    setVariantFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetVariantForm = () => {
    setVariantFormData({
      category_id: '',
      sub_category_id: '',
      product_id: '',
      attribute_id: '',
      attribute_value_id: '',
      sku: '',
      price: '',
      is_active: true
    });
    setVariantFormErrors({});
  };

  const handleAddProductVariant = async () => {
    if (!validateVariantForm()) return;

    setIsVariantSubmitting(true);
    try {
      const selectedProduct = products.find((p) => p.id === Number(variantFormData.product_id));
      const baseSku = (selectedProduct?.base_sku || '').toString().trim().toUpperCase();
      const skuSuffix = variantFormData.sku.trim().toUpperCase();
      const composedSku = baseSku
        ? `${baseSku}${baseSku.endsWith('-') ? '' : '-'}${skuSuffix}`
        : skuSuffix; // Compose final SKU: BASE + '-' + 3-letter suffix

      const response = await fetch('/api/product-variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: Number(variantFormData.product_id),
          attribute_value_id: Number(variantFormData.attribute_value_id),
          sku: composedSku,
          price: Number(variantFormData.price),
          is_active: variantFormData.is_active
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setIsAddVariantModalOpen(false);
        resetVariantForm();
        await fetchAllProducts();
        await fetchAllVariants();
        setProductsError(null);
      } else {
        setProductsError(result.error || 'Failed to create product variant');
      }
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsVariantSubmitting(false);
    }
  };

  const closeVariantModals = () => {
    setIsAddVariantModalOpen(false);
    resetVariantForm();
  };

  const validateAttrValueForm = (): boolean => {
    const errors: Partial<AttributeValueFormData> = {};
    
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
        await fetchAllAttributeValues(); // Update count in summary card
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
        body: JSON.stringify({
          attribute_value_id: editingAttributeValue.attribute_value_id,
          ...attrValueFormData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditAttrValueModalOpen(false);
        setEditingAttributeValue(null);
        resetAttrValueForm();
        await fetchAttributeValues(selectedAttributeId);
        await fetchAllAttributeValues(); // Update count in summary card
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
        await fetchAllAttributeValues(); // Update count in summary card
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
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-gray-900">ประเภทและหมวดหมู่ของสินค้า</h1>
          <p className="text-sm text-gray-600 mt-0.5">การจัดการประเภท/หมวดหมู่/คุณสมบัติสินค้า</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-600">อัปเดตเมื่อ {formatThaiDate()}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button 
            onClick={() => setIsEditMode((prev) => !prev)}
            variant={isEditMode ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 flex items-center gap-1.5 text-xs px-2"
            disabled={currentView === 'categories' || currentView === 'attributes'}
          >
            {isEditMode ? 'ยกเลิกโหมดแก้ไข' : 'โหมดแก้ไข'}
          </Button>
          {currentView === 'subcategories' && (
            <Button
              onClick={() => setIsAddSubModalOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหมวดหมู่สินค้า</span>
            </Button>
          )}
          {currentView === 'attributeValues' && (
            <Button
              onClick={() => setIsAddAttrValueModalOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มคุณสมบัติสินค้า</span>
            </Button>
          )}
          {currentView === 'products' && (
            <Button
              onClick={() => setIsAddVariantModalOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มความหลากหลาย</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards - 5 tabs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* All Product Types */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'categories' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('categories')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">ประเภทสินค้าทั้งหมด</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : categories.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Subcategories */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'subcategories' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('subcategories')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">หมวดหมู่ย่อยทั้งหมด</p>
                <p className="text-lg font-bold text-gray-900">
                  {subLoading ? '...' : subCategories.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Grid className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Product Items */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'products' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('products')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">ความหลากหลายของสินค้า</p>
                <p className="text-lg font-bold text-gray-900">
                  {variantsLoading ? '...' : variants.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Attributes */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'attributes' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('attributes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">คุณสมบัติหลัก</p>
                <p className="text-lg font-bold text-gray-900">
                  {attrLoading ? '...' : attributes.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Square className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Sub-attributes */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'attributeValues' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('attributeValues')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">คุณสมบัติย่อยทั้งหมด</p>
                <p className="text-lg font-bold text-gray-900">
                  {attrLoading ? '...' : attributeValues.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditMode && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
          คลิกแถวรายการเพื่อแก้ไขข้อมูล{currentView === 'subcategories' ? 'หมวดย่อย' : currentView === 'attributeValues' ? 'ค่าคุณสมบัติ' : currentView === 'categories' ? 'ประเภทสินค้า' : currentView === 'attributes' ? 'คุณสมบัติ' : 'สินค้า'}
        </div>
      )}

      {/* Categories View */}
      {currentView === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ประเภทสินค้า (Categories)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-600">กำลังโหลดประเภทสินค้า...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <THead>
                    <TR>
                      <TH>รหัส</TH>
                      <TH>ชื่อประเภท (ไทย)</TH>
                      <TH>ชื่อประเภท (อังกฤษ)</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {categories.length === 0 ? (
                      <TR>
                        <TD colSpan={3} className="text-center text-gray-500 py-8">
                          ไม่พบข้อมูลประเภทสินค้า
                        </TD>
                      </TR>
                    ) : (
                      categories.map((cat) => (
                        <TR key={cat.category_id}>
                          <TD>{cat.category_id}</TD>
                          <TD>{cat.category_name_th || cat.category_name}</TD>
                          <TD>{cat.category_name_en || 'N/A'}</TD>
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

      {/* Products (Variants) View */}
      {currentView === 'products' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">ความหลากหลายของสินค้า (Products)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="text-sm">ส่งออกข้อมูล</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {variantsLoading ? (
              <div className="text-sm text-gray-600">กำลังโหลดความหลากหลายของสินค้า...</div>
            ) : variantsError ? (
              <div className="text-sm text-red-600">{variantsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <THead>
                    <TR>
                      <TH>รหัส</TH>
                      <TH>ชื่อสินค้า</TH>
                      <TH>คุณสมบัติ</TH>
                      <TH>SKU</TH>
                      <TH>ราคา</TH>
                      <TH>สถานะ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {variants.length === 0 ? (
                      <TR>
                        <TD colSpan={6} className="text-center text-gray-500 py-8">
                          ไม่พบข้อมูลความหลากหลายของสินค้า
                        </TD>
                      </TR>
                    ) : (
                      variants.map((v) => (
                        <TR key={v.variant_id}
                          onClick={() => { if (isEditMode) { setEditingVariant(v); setVariantFormData({
                            category_id: '', sub_category_id: '', product_id: String(v.product_id), attribute_id: '', attribute_value_id: String(v.attribute_value_id || ''), sku: '', price: String(v.price ?? ''), is_active: !!v.is_active
                          }); setVariantFormErrors({}); setIsEditVariantModalOpen(true);} }}
                          className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                        >
                          <TD>{v.variant_id}</TD>
                          <TD>{v.product_name_th}</TD>
                          <TD>{v.attribute_label}</TD>
                          <TD>{v.sku || '-'}</TD>
                          <TD>{`฿${Number(v.price).toFixed(2)}`}</TD>
                          <TD>
                            {v.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-green-100 text-green-800">เปิดการขาย</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-gray-100 text-gray-800">ไม่พร้อมใช้งาน</span>
                            )}
                          </TD>
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

      {/* Edit Variant Modal */}
      <Modal
        isOpen={isEditVariantModalOpen}
        onClose={() => { setIsEditVariantModalOpen(false); setEditingVariant(null); }}
        title="แก้ไขความหลากหลายของสินค้า"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_variant_id">รหัสความหลากหลาย</Label>
            <Input id="edit_variant_id" value={editingVariant?.variant_id || ''} disabled className="bg-gray-100" />
          </div>
          <div>
            <Label htmlFor="edit_variant_price">ราคา *</Label>
            <Input id="edit_variant_price" type="number" step="0.01" min="0" value={variantFormData.price} onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit_variant_is_active" checked={variantFormData.is_active} onChange={(e) => setVariantFormData({ ...variantFormData, is_active: e.target.checked })} className="w-4 h-4" />
            <Label htmlFor="edit_variant_is_active" className="cursor-pointer">เปิดใช้งาน</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsEditVariantModalOpen(false); setEditingVariant(null); }}>ยกเลิก</Button>
            <Button variant="destructive" onClick={() => { setIsEditVariantModalOpen(false); setIsDeleteVariantModalOpen(true); }}>ลบ</Button>
            <Button className="bg-blue-500 hover:bg-blue-600" disabled={isVariantSubmitting} onClick={async () => {
              setIsVariantSubmitting(true);
              try {
                const res = await fetch('/api/product-variants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variant_id: editingVariant.variant_id, price: Number(variantFormData.price), is_active: variantFormData.is_active }) });
                const json = await res.json();
                if (json.ok) { await fetchAllVariants(); setVariantsError(null); setIsEditVariantModalOpen(false); setEditingVariant(null); }
                else { setVariantsError(json.error || 'Failed to update variant'); }
              } catch (e: any) { setVariantsError(e?.message || 'An error occurred'); } finally { setIsVariantSubmitting(false); }
            }}>บันทึกการเปลี่ยนแปลง</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Variant Modal */}
      <Modal
        isOpen={isDeleteVariantModalOpen}
        onClose={() => { setIsDeleteVariantModalOpen(false); setEditingVariant(null); }}
        title="ยืนยันการลบความหลากหลายของสินค้า"
      >
        <div className="space-y-4">
          <p className="text-gray-700">คุณแน่ใจหรือไม่ที่จะลบความหลากหลายรหัส <strong>{editingVariant?.variant_id}</strong> ของสินค้า <strong>{editingVariant?.product_name_th}</strong>?</p>
          <p className="text-sm text-red-600">หากมีการอ้างอิงในสต็อก (Inventories) ระบบจะไม่อนุญาตให้ลบ</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteVariantModalOpen(false); setEditingVariant(null); }}>ยกเลิก</Button>
            <Button variant="destructive" disabled={isVariantSubmitting} onClick={async () => {
              setIsVariantSubmitting(true);
              try {
                const res = await fetch(`/api/product-variants?id=${editingVariant.variant_id}`, { method: 'DELETE' });
                const json = await res.json();
                if (json.ok) { await fetchAllVariants(); setVariantsError(null); setIsDeleteVariantModalOpen(false); setEditingVariant(null); }
                else { setVariantsError(json.error || 'Failed to delete variant'); }
              } catch (e: any) { setVariantsError(e?.message || 'An error occurred'); }
              finally { setIsVariantSubmitting(false); }
            }}>ลบ</Button>
          </div>
        </div>
      </Modal>

      {/* Attributes View */}
      {currentView === 'attributes' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">คุณสมบัติหลัก (Attributes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attrLoading ? (
              <div className="text-sm text-gray-600">กำลังโหลดคุณสมบัติ...</div>
            ) : attrError ? (
              <div className="text-sm text-red-600">{attrError}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <THead>
                    <TR>
                      <TH>รหัส</TH>
                      <TH>ชื่อคุณสมบัติ (ไทย)</TH>
                      <TH>ชื่อคุณสมบัติ (อังกฤษ)</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {attributes.length === 0 ? (
                      <TR>
                        <TD colSpan={3} className="text-center text-gray-500 py-8">
                          ไม่พบข้อมูลคุณสมบัติ
                        </TD>
                      </TR>
                    ) : (
                      attributes.map((attr) => (
                        <TR key={attr.attribute_id}>
                          <TD>{attr.attribute_id}</TD>
                          <TD>{attr.attribute_name_th}</TD>
                          <TD>{attr.attribute_name_en}</TD>
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
                        {(c as any).category_name_th || c.category_name || 'Unnamed'}
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
                      <TH>รหัส</TH>
                      <TH>ชื่อหมวดย่อย (ไทย)</TH>
                      <TH>ชื่อหมวดย่อย (อังกฤษ)</TH>
                      <TH>ประเภทหลัก</TH>
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
                        <TD>{sc.sub_category_name_th}</TD>
                        <TD>{sc.sub_category_name_en}</TD>
                        <TD>{sc.category_name_th || sc.category_name || 'N/A'}</TD>
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
      {currentView === 'attributeValues' && (
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
                      <TH>รหัส</TH>
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
            <Label htmlFor="sub_category_name_th">ชื่อหมวดย่อย (ไทย) *</Label>
            <Input
              id="sub_category_name_th"
              value={subFormData.sub_category_name_th}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name_th: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อยภาษาไทย"
              className={subFormErrors.sub_category_name_th ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name_th && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sub_category_name_en">ชื่อหมวดย่อย (อังกฤษ) *</Label>
            <Input
              id="sub_category_name_en"
              value={subFormData.sub_category_name_en}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name_en: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อยภาษาอังกฤษ"
              className={subFormErrors.sub_category_name_en ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name_en && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name_en}</p>
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
              value={editingSubcategory?.sub_category_id || ''}
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
            <Label htmlFor="edit_sub_category_name_th">ชื่อหมวดย่อย (ไทย) *</Label>
            <Input
              id="edit_sub_category_name_th"
              value={subFormData.sub_category_name_th}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name_th: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อยภาษาไทย"
              className={subFormErrors.sub_category_name_th ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name_th && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_sub_category_name_en">ชื่อหมวดย่อย (อังกฤษ) *</Label>
            <Input
              id="edit_sub_category_name_en"
              value={subFormData.sub_category_name_en}
              onChange={(e) => setSubFormData({ ...subFormData, sub_category_name_en: e.target.value })}
              placeholder="กรอกชื่อหมวดย่อยภาษาอังกฤษ"
              className={subFormErrors.sub_category_name_en ? 'border-red-500' : ''}
            />
            {subFormErrors.sub_category_name_en && (
              <p className="text-red-500 text-sm mt-1">{subFormErrors.sub_category_name_en}</p>
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
            คุณแน่ใจหรือไม่ที่จะลบหมวดย่อย <strong>"{deletingSubcategory?.sub_category_name_th || deletingSubcategory?.sub_category_name_en}"</strong> (รหัส: {deletingSubcategory?.sub_category_id})?
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
              value={editingAttributeValue?.attribute_value_id || ''}
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

      {/* Add Product Variant Modal */}
      <Modal
        isOpen={isAddVariantModalOpen}
        onClose={closeVariantModals}
        title="เพิ่มความหลากหลายของสินค้า"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="variant_category_id">ประเภทสินค้า *</Label>
            <Select 
              value={variantFormData.category_id} 
              onValueChange={(value: string) => setVariantFormData({ 
                ...variantFormData, 
                category_id: value,
                sub_category_id: '', // Reset sub_category when category changes
                product_id: '' // Reset product when category changes
              })}
            >
              <SelectTrigger className={variantFormErrors.category_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                    {cat.category_name_th || cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variantFormErrors.category_id && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.category_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="variant_sub_category_id">หมวดหมู่ย่อย *</Label>
            <Select 
              value={variantFormData.sub_category_id} 
              onValueChange={(value: string) => setVariantFormData({ 
                ...variantFormData, 
                sub_category_id: value,
                product_id: '' // Reset product when sub_category changes
              })}
              disabled={!variantFormData.category_id}
            >
              <SelectTrigger className={variantFormErrors.sub_category_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={variantFormData.category_id ? "เลือกหมวดหมู่ย่อย" : "เลือกประเภทสินค้าก่อน"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubCategoriesForVariant.map((sc) => (
                  <SelectItem key={sc.sub_category_id} value={String(sc.sub_category_id)}>
                    {sc.sub_category_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variantFormErrors.sub_category_id && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.sub_category_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="variant_product_id">สินค้า *</Label>
            <Select 
              value={variantFormData.product_id} 
              onValueChange={(value: string) => setVariantFormData({ ...variantFormData, product_id: value })}
              disabled={!variantFormData.sub_category_id}
            >
              <SelectTrigger className={(variantFormErrors.product_id ? 'border-red-500 ' : '') + 'h-auto min-h-[44px] py-2 whitespace-normal text-left'}>
                <SelectValue placeholder={variantFormData.sub_category_id ? "เลือกสินค้า" : "เลือกหมวดหมู่ย่อยก่อน"} />
              </SelectTrigger>
              <SelectContent className="w-[520px] max-w-[90vw]">
                {filteredProductsForVariant.map((prod) => (
                  <SelectItem key={prod.id} value={String(prod.id)} className="whitespace-normal break-words leading-tight py-2">
                    {prod.product_name_th} ({prod.product_name_en})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variantFormErrors.product_id && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.product_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="variant_attribute_id">คุณสมบัติหลัก *</Label>
            <Select 
              value={variantFormData.attribute_id} 
              onValueChange={(value: string) => setVariantFormData({ 
                ...variantFormData, 
                attribute_id: value,
                attribute_value_id: '' // Reset attribute value when attribute changes
              })}
            >
              <SelectTrigger className={variantFormErrors.attribute_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="เลือกคุณสมบัติหลัก" />
              </SelectTrigger>
              <SelectContent>
                {attributes.map((attr) => (
                  <SelectItem key={attr.attribute_id} value={String(attr.attribute_id)}>
                    {attr.attribute_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variantFormErrors.attribute_id && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.attribute_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="variant_attribute_value_id">ค่าคุณสมบัติ *</Label>
            <Select 
              value={variantFormData.attribute_value_id} 
              onValueChange={(value: string) => setVariantFormData({ ...variantFormData, attribute_value_id: value })}
              disabled={!variantFormData.attribute_id}
            >
              <SelectTrigger className={variantFormErrors.attribute_value_id ? 'border-red-500' : ''}>
                <SelectValue placeholder={variantFormData.attribute_id ? "เลือกค่าคุณสมบัติ" : "เลือกคุณสมบัติหลักก่อน"} />
              </SelectTrigger>
              <SelectContent>
                {filteredAttributeValuesForVariant.map((av) => (
                  <SelectItem key={av.attribute_value_id} value={String(av.attribute_value_id)}>
                    {av.attribute_value_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variantFormErrors.attribute_value_id && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.attribute_value_id}</p>
            )}
          </div>
          <div>
            <Label htmlFor="variant_sku">SKU *</Label>
            <Input
              id="variant_sku"
              value={variantFormData.sku}
              onChange={(e) => {
                // Only allow uppercase letters A-Z, max 3 characters
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
                setVariantFormData({ ...variantFormData, sku: value });
              }}
              placeholder="กรอก SKU (3 ตัวอักษร A-Z)"
              maxLength={3}
              className={variantFormErrors.sku ? 'border-red-500' : ''}
            />
            {variantFormErrors.sku && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.sku}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษ 3 ตัว (A-Z) เท่านั้น
            </p>
            {/* SKU preview composed with base SKU */}
            {(() => {
              const selected = products.find(p => p.id === Number(variantFormData.product_id));
              const base = (selected?.base_sku || '').toString().toUpperCase();
              const suffix = (variantFormData.sku || '').toString().toUpperCase();
              const preview = base ? `${base}${base.endsWith('-') ? '' : '-'}${suffix}` : suffix;
              return (
                <p className="text-xs text-gray-600 mt-1">SKU ที่จะบันทึก: <span className="font-medium">{preview || '-'}</span></p>
              );
            })()}
          </div>
          <div>
            <Label htmlFor="variant_price">ราคา *</Label>
            <Input
              id="variant_price"
              type="number"
              step="0.01"
              min="0"
              value={variantFormData.price}
              onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
              placeholder="กรอกราคา"
              className={variantFormErrors.price ? 'border-red-500' : ''}
            />
            {variantFormErrors.price && (
              <p className="text-red-500 text-sm mt-1">{variantFormErrors.price}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="variant_is_active"
              checked={variantFormData.is_active}
              onChange={(e) => setVariantFormData({ ...variantFormData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="variant_is_active" className="cursor-pointer">
              เปิดใช้งาน
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeVariantModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddProductVariant}
              disabled={isVariantSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isVariantSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

