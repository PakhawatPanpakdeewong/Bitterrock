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
  Square,
  Filter,
  RefreshCw,
  Upload,
  Plus,
  ShoppingBag
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
  attribute_value_code?: string;
};

type AttributeFormData = {
  attribute_name_th: string;
  attribute_name_en: string;
};

type AttributeValueFormData = {
  attribute_id: string;
  attribute_value_th: string;
  attribute_value_en: string;
  attribute_value_code: string;
};

type Brand = {
  brand_id: number;
  brand_name_th: string;
  brand_name_en: string;
  brand_code: string;
  sub_category_id?: number | null;
  sub_category_name_th?: string | null;
  sub_category_name_en?: string | null;
};

type BrandFormData = {
  brand_name_th: string;
  brand_name_en: string;
  brand_code: string;
  sub_category_id?: string;
};


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View toggle state - support 5 views
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'attributes' | 'attributeValues' | 'brands'>('categories');
  
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

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandCategoryId, setSelectedBrandCategoryId] = useState<string>('all');
  const [selectedBrandSubCategoryId, setSelectedBrandSubCategoryId] = useState<string>('all');
  const [brandLoading, setBrandLoading] = useState<boolean>(false);
  const [brandError, setBrandError] = useState<string | null>(null);

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
    attribute_value_en: '',
    attribute_value_code: ''
  });
  const [attrValueFormErrors, setAttrValueFormErrors] = useState<Partial<AttributeValueFormData>>({});
  const [isAttrValueSubmitting, setIsAttrValueSubmitting] = useState(false);

  // Modal states for brands
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [isEditBrandModalOpen, setIsEditBrandModalOpen] = useState(false);
  const [isDeleteBrandModalOpen, setIsDeleteBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [deletingBrand, setDeletingBrand] = useState<any>(null);

  // Form states for brands
  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    brand_name_th: '',
    brand_name_en: '',
    brand_code: '',
    sub_category_id: ''
  });
  const [brandFormErrors, setBrandFormErrors] = useState<Partial<BrandFormData>>({});
  const [isBrandSubmitting, setIsBrandSubmitting] = useState(false);


  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchAllSubCategories();
    fetchAllAttributeValues();
    fetchBrands(selectedBrandSubCategoryId);
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

  useEffect(() => {
    if (currentView === 'brands') {
      fetchBrands(selectedBrandCategoryId, selectedBrandSubCategoryId);
    }
  }, [selectedBrandCategoryId, selectedBrandSubCategoryId, currentView]);

  // Reset subcategory filter when category changes
  useEffect(() => {
    if (currentView === 'brands' && selectedBrandCategoryId === 'all') {
      setSelectedBrandSubCategoryId('all');
    }
  }, [selectedBrandCategoryId, currentView]);

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
      fetchBrands(selectedBrandSubCategoryId)
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

  const fetchBrands = async (categoryId?: string, subcategoryId?: string) => {
    try {
      setBrandLoading(true);
      setBrandError(null);
      let url = '/api/brands';
      const params: string[] = [];
      
      // If subcategory is selected, filter by subcategory
      if (subcategoryId && subcategoryId !== 'all') {
        params.push(`subcategory_id=${encodeURIComponent(subcategoryId)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        let filteredBrands = Array.isArray(data.data) ? data.data : [];
        
        // Filter by category if selected (but no subcategory selected)
        if (categoryId && categoryId !== 'all' && (!subcategoryId || subcategoryId === 'all')) {
          // Filter brands that belong to subcategories of the selected category
          const categorySubCategories = subCategories.filter(sc => String(sc.category_id) === categoryId);
          const categorySubCategoryIds = categorySubCategories.map(sc => sc.sub_category_id);
          filteredBrands = filteredBrands.filter((brand: Brand) => 
            brand.sub_category_id && categorySubCategoryIds.includes(brand.sub_category_id)
          );
        }
        
        setBrands(filteredBrands);
      } else {
        setBrandError(data.error || 'Failed to fetch brands');
      }
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBrandLoading(false);
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
      attribute_value_en: attributeValue.attribute_value_en,
      attribute_value_code: attributeValue.attribute_value_code || ''
    });
    setAttrValueFormErrors({});
    setIsEditAttrValueModalOpen(true);
  };

  const resetAttrValueForm = () => {
    setAttrValueFormData({
      attribute_id: '',
      attribute_value_th: '',
      attribute_value_en: '',
      attribute_value_code: ''
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
    
    // Validate attribute_value_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Za-z0-9]{3}$/;
    if (!attrValueFormData.attribute_value_code.trim()) {
      errors.attribute_value_code = 'รหัสเริ่มต้นจำเป็นต้องกรอก';
    } else if (!codePattern.test(attrValueFormData.attribute_value_code.trim())) {
      errors.attribute_value_code = 'รหัสเริ่มต้นต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น';
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

  // Brand Functions
  const validateBrandForm = (): boolean => {
    const errors: Partial<BrandFormData> = {};
    
    if (!brandFormData.brand_name_th.trim()) {
      errors.brand_name_th = 'ชื่อแบรนด์ (ไทย) จำเป็นต้องกรอก';
    }
    
    if (!brandFormData.brand_name_en.trim()) {
      errors.brand_name_en = 'ชื่อแบรนด์ (อังกฤษ) จำเป็นต้องกรอก';
    }
    
    // Validate brand_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Z0-9]{3}$/;
    if (!brandFormData.brand_code.trim()) {
      errors.brand_code = 'รหัสแบรนด์จำเป็นต้องกรอก';
    } else if (!codePattern.test(brandFormData.brand_code.trim())) {
      errors.brand_code = 'รหัสแบรนด์ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น';
    }
    
    setBrandFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetBrandForm = () => {
    setBrandFormData({
      brand_name_th: '',
      brand_name_en: '',
      brand_code: '',
      sub_category_id: ''
    });
    setBrandFormErrors({});
  };

  const openEditBrandModal = (brand: any) => {
    setEditingBrand(brand);
    setBrandFormData({
      brand_name_th: brand.brand_name_th,
      brand_name_en: brand.brand_name_en,
      brand_code: brand.brand_code,
      sub_category_id: brand.sub_category_id ? String(brand.sub_category_id) : ''
    });
    setBrandFormErrors({});
    setIsEditBrandModalOpen(true);
  };

  const openDeleteBrandModal = (brand: any) => {
    setDeletingBrand(brand);
    setIsDeleteBrandModalOpen(true);
  };

  const closeBrandModals = () => {
    setIsAddBrandModalOpen(false);
    setIsEditBrandModalOpen(false);
    setIsDeleteBrandModalOpen(false);
    setEditingBrand(null);
    setDeletingBrand(null);
    resetBrandForm();
    setBrandError(null);
  };

  const handleAddBrand = async () => {
    if (!validateBrandForm()) return;

    setIsBrandSubmitting(true);
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandFormData),
      });

      const result = await response.json();

      if (result.success) {
        setIsAddBrandModalOpen(false);
        resetBrandForm();
        await fetchBrands(selectedBrandCategoryId, selectedBrandSubCategoryId);
        setBrandError(null);
      } else {
        setBrandError(result.error || 'Failed to create brand');
      }
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsBrandSubmitting(false);
    }
  };

  const handleEditBrand = async () => {
    if (!validateBrandForm() || !editingBrand) return;

    setIsBrandSubmitting(true);
    try {
      const response = await fetch('/api/brands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: editingBrand.brand_id,
          ...brandFormData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditBrandModalOpen(false);
        setEditingBrand(null);
        resetBrandForm();
        await fetchBrands(selectedBrandCategoryId, selectedBrandSubCategoryId);
        setBrandError(null);
      } else {
        setBrandError(result.error || 'Failed to update brand');
      }
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsBrandSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;

    setIsBrandSubmitting(true);
    setBrandError(null);
    try {
      const response = await fetch(`/api/brands?id=${deletingBrand.brand_id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsDeleteBrandModalOpen(false);
        setDeletingBrand(null);
        await fetchBrands(selectedBrandCategoryId, selectedBrandSubCategoryId);
        setBrandError(null);
      } else {
        // Show error in modal, not in the main view
        setBrandError(result.error || result.details || 'Failed to delete brand');
      }
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsBrandSubmitting(false);
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
          {currentView === 'brands' && (
            <Button
              onClick={() => setIsAddBrandModalOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มแบรนด์</span>
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
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Grid className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brands */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            currentView === 'brands' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCurrentView('brands')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">แบรนด์ของสินค้า</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
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
          คลิกแถวรายการเพื่อแก้ไขข้อมูล{currentView === 'subcategories' ? 'หมวดย่อย' : currentView === 'attributeValues' ? 'ค่าคุณสมบัติ' : currentView === 'categories' ? 'ประเภทสินค้า' : currentView === 'attributes' ? 'คุณสมบัติ' : 'แบรนด์'}
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
                      <TH>รหัสเริ่มต้น</TH>
                      <TH>คุณสมบัติ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {attributeValues.length === 0 ? (
                      <TR>
                        <TD colSpan={5} className="text-center text-gray-500 py-8">
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
                          <TD>{av.attribute_value_code || '-'}</TD>
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

      {/* Brands View */}
      {currentView === 'brands' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">แบรนด์ของสินค้า (Brands)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="brand-category-filter">กรองตามประเภทหลัก</Label>
                <Select value={selectedBrandCategoryId} onValueChange={(value: string) => {
                  setSelectedBrandCategoryId(value);
                  setSelectedBrandSubCategoryId('all');
                }}>
                  <SelectTrigger id="brand-category-filter" className="w-[260px]">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                        {cat.category_name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="brand-subcategory-filter">กรองตามหมวดหมู่ย่อย</Label>
                <Select 
                  value={selectedBrandSubCategoryId} 
                  onValueChange={(value: string) => setSelectedBrandSubCategoryId(value)}
                  disabled={selectedBrandCategoryId === 'all'}
                >
                  <SelectTrigger id="brand-subcategory-filter" className="w-[260px]">
                    <SelectValue placeholder={selectedBrandCategoryId === 'all' ? 'เลือกประเภทหลักก่อน' : 'ทั้งหมด'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {subCategories
                      .filter(sc => selectedBrandCategoryId === 'all' || String(sc.category_id) === selectedBrandCategoryId)
                      .map((sc) => (
                        <SelectItem key={sc.sub_category_id} value={String(sc.sub_category_id)}>
                          {sc.sub_category_name_th}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => fetchBrands(selectedBrandCategoryId, selectedBrandSubCategoryId)}>
                รีเฟรช
              </Button>
            </div>

            {brandLoading ? (
              <div className="text-sm text-gray-600">กำลังโหลดแบรนด์...</div>
            ) : brandError ? (
              <div className="text-sm text-red-600">{brandError}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <THead>
                    <TR>
                      <TH>รหัส</TH>
                      <TH>ชื่อแบรนด์ (ไทย)</TH>
                      <TH>ชื่อแบรนด์ (อังกฤษ)</TH>
                      <TH>รหัสแบรนด์</TH>
                      <TH>หมวดหมู่ย่อย</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {brands.length === 0 ? (
                      <TR>
                        <TD colSpan={5} className="text-center text-gray-500 py-8">
                          ไม่พบข้อมูลแบรนด์
                        </TD>
                      </TR>
                    ) : (
                      brands.map((brand) => (
                        <TR 
                          key={brand.brand_id}
                          onClick={() => { if (isEditMode) openEditBrandModal(brand); }}
                          className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                        >
                          <TD>{brand.brand_id}</TD>
                          <TD>{brand.brand_name_th}</TD>
                          <TD>{brand.brand_name_en}</TD>
                          <TD>{brand.brand_code}</TD>
                          <TD>{brand.sub_category_name_th || '-'}</TD>
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
          <div>
            <Label htmlFor="attribute_value_code">รหัสเริ่มต้น *</Label>
            <Input
              id="attribute_value_code"
              value={attrValueFormData.attribute_value_code}
              onChange={(e) => {
                // Only allow alphanumeric characters, max 3 characters
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3);
                setAttrValueFormData({ ...attrValueFormData, attribute_value_code: value });
              }}
              placeholder="กรอกรหัสเริ่มต้น (3 ตัว)"
              maxLength={3}
              className={attrValueFormErrors.attribute_value_code ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_code && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAttrValueModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddAttributeValue}
              disabled={isAttrValueSubmitting}
              className="bg-green-500 hover:bg-green-600"
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
          <div>
            <Label htmlFor="edit_attribute_value_code">รหัสเริ่มต้น *</Label>
            <Input
              id="edit_attribute_value_code"
              value={attrValueFormData.attribute_value_code}
              onChange={(e) => {
                // Only allow alphanumeric characters, max 3 characters
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3);
                setAttrValueFormData({ ...attrValueFormData, attribute_value_code: value });
              }}
              placeholder="กรอกรหัสเริ่มต้น (3 ตัว)"
              maxLength={3}
              className={attrValueFormErrors.attribute_value_code ? 'border-red-500' : ''}
            />
            {attrValueFormErrors.attribute_value_code && (
              <p className="text-red-500 text-sm mt-1">{attrValueFormErrors.attribute_value_code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
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
              className="bg-green-500 hover:bg-green-600"
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

      {/* Add Brand Modal */}
      <Modal
        isOpen={isAddBrandModalOpen}
        onClose={closeBrandModals}
        title="เพิ่มแบรนด์ใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="brand_name_th">ชื่อแบรนด์ (ไทย) *</Label>
            <Input
              id="brand_name_th"
              value={brandFormData.brand_name_th}
              onChange={(e) => setBrandFormData({ ...brandFormData, brand_name_th: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาไทย"
              className={brandFormErrors.brand_name_th ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_name_th && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_name_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="brand_name_en">ชื่อแบรนด์ (อังกฤษ) *</Label>
            <Input
              id="brand_name_en"
              value={brandFormData.brand_name_en}
              onChange={(e) => setBrandFormData({ ...brandFormData, brand_name_en: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาอังกฤษ"
              className={brandFormErrors.brand_name_en ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_name_en && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_name_en}</p>
            )}
          </div>
          <div>
            <Label htmlFor="brand_code">รหัสแบรนด์ *</Label>
            <Input
              id="brand_code"
              value={brandFormData.brand_code}
              onChange={(e) => {
                // Only allow alphanumeric characters, max 3 characters
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                setBrandFormData({ ...brandFormData, brand_code: value });
              }}
              placeholder="กรอกรหัสแบรนด์ (3 ตัว)"
              maxLength={3}
              className={brandFormErrors.brand_code ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_code && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
          </div>
          <div>
            <Label htmlFor="brand_sub_category_id">หมวดหมู่ย่อย</Label>
            <Select 
              value={brandFormData.sub_category_id || 'none'} 
              onValueChange={(value: string) => setBrandFormData({ ...brandFormData, sub_category_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger id="brand_sub_category_id">
                <SelectValue placeholder="เลือกหมวดหมู่ย่อย (ไม่บังคับ)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {subCategories.map((sc) => (
                  <SelectItem key={sc.sub_category_id} value={String(sc.sub_category_id)}>
                    {sc.sub_category_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeBrandModals}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddBrand}
              disabled={isBrandSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isBrandSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Brand Modal */}
      <Modal
        isOpen={isEditBrandModalOpen}
        onClose={closeBrandModals}
        title="แก้ไขแบรนด์"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_brand_id">รหัสแบรนด์ (ไม่สามารถแก้ไขได้)</Label>
            <Input
              id="edit_brand_id"
              value={editingBrand?.brand_id || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="edit_brand_name_th">ชื่อแบรนด์ (ไทย) *</Label>
            <Input
              id="edit_brand_name_th"
              value={brandFormData.brand_name_th}
              onChange={(e) => setBrandFormData({ ...brandFormData, brand_name_th: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาไทย"
              className={brandFormErrors.brand_name_th ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_name_th && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_name_th}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_brand_name_en">ชื่อแบรนด์ (อังกฤษ) *</Label>
            <Input
              id="edit_brand_name_en"
              value={brandFormData.brand_name_en}
              onChange={(e) => setBrandFormData({ ...brandFormData, brand_name_en: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาอังกฤษ"
              className={brandFormErrors.brand_name_en ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_name_en && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_name_en}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_brand_code">รหัสแบรนด์ *</Label>
            <Input
              id="edit_brand_code"
              value={brandFormData.brand_code}
              onChange={(e) => {
                // Only allow alphanumeric characters, max 3 characters
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                setBrandFormData({ ...brandFormData, brand_code: value });
              }}
              placeholder="กรอกรหัสแบรนด์ (3 ตัว)"
              maxLength={3}
              className={brandFormErrors.brand_code ? 'border-red-500' : ''}
            />
            {brandFormErrors.brand_code && (
              <p className="text-red-500 text-sm mt-1">{brandFormErrors.brand_code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
          </div>
          <div>
            <Label htmlFor="edit_brand_sub_category_id">หมวดหมู่ย่อย</Label>
            <Select 
              value={brandFormData.sub_category_id || 'none'} 
              onValueChange={(value: string) => setBrandFormData({ ...brandFormData, sub_category_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger id="edit_brand_sub_category_id">
                <SelectValue placeholder="เลือกหมวดหมู่ย่อย (ไม่บังคับ)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {subCategories.map((sc) => (
                  <SelectItem key={sc.sub_category_id} value={String(sc.sub_category_id)}>
                    {sc.sub_category_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeBrandModals}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (!editingBrand) return;
                setIsEditBrandModalOpen(false);
                setDeletingBrand(editingBrand);
                setIsDeleteBrandModalOpen(true);
              }}
            >
              ลบ
            </Button>
            <Button 
              onClick={handleEditBrand}
              disabled={isBrandSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isBrandSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Brand Modal */}
      <Modal
        isOpen={isDeleteBrandModalOpen}
        onClose={closeBrandModals}
        title="ยืนยันการลบแบรนด์"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบแบรนด์ <strong>"{deletingBrand?.brand_name_th}"</strong> (รหัส: {deletingBrand?.brand_id})?
          </p>
          <p className="text-sm text-red-600">
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
          {brandError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {brandError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setBrandError(null); closeBrandModals(); }}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteBrand}
              disabled={isBrandSubmitting}
            >
              {isBrandSubmitting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>


    </div>
  );
}

