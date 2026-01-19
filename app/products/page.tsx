"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Grid, List, RefreshCw, Search, Plus, Pencil, Upload } from "lucide-react";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type Variant = {
  variant_id: number;
  variant_name: string;
  sku: string | null;
  price: number;
  description?: string;
  image_url?: string | null;
  is_active?: boolean | null;
  attribute_value_ids?: number[];
  attribute_ids?: number[];
};

type Product = {
  id: number;
  brand_id?: number | null;
  sub_category_id?: number | null;
  sub_categories_name: string | null;
  brand_name_th?: string | null;
  brand_name_en?: string | null;
  brand_code?: string | null;
  product_name: string; // using TH name from API (for backward compatibility)
  product_name_th: string;
  product_name_en: string;
  description: string | null;
  variants: Variant[];
};

const mockProducts: Product[] = [];

type R2Item = { key: string; url: string | null };

export default function ProductsPage() {
  const [images, setImages] = useState<R2Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    product_name_th: "",
    product_name_en: "",
    base_price: "",
    base_sku: "",
    description: "",
    sub_category_id: "",
    brand_id: "",
  });
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [step2ValidationAttempted, setStep2ValidationAttempted] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<null | (Product & {
    product_name_th?: string;
    product_name_en?: string;
  })>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploadedImage, setEditUploadedImage] = useState<File | null>(null);
  const [editVariantIsActive, setEditVariantIsActive] = useState<boolean>(true);
  const [editCurrentImages, setEditCurrentImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editNewImagePreviews, setEditNewImagePreviews] = useState<string[]>([]);
  const [editImagesToDelete, setEditImagesToDelete] = useState<string[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailSelectedVariant, setDetailSelectedVariant] = useState<Variant | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selectedDetailImageIndex, setSelectedDetailImageIndex] = useState<number>(0);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [checkingInventory, setCheckingInventory] = useState<boolean>(false);

  const [serverProducts, setServerProducts] = useState<Product[]>(mockProducts);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'picture' | 'card' | 'variants'>('card');
  // Variants state for variants table view
  const [variants, setVariants] = useState<any[]>([]);
  const [variantsLoading, setVariantsLoading] = useState<boolean>(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [variantsFilterCategoryId, setVariantsFilterCategoryId] = useState<string>('all');
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [isDeleteVariantModalOpen, setIsDeleteVariantModalOpen] = useState(false);
  const [variantFormData, setVariantFormData] = useState({
    price: '',
    is_active: true
  });
  const [isVariantSubmitting, setIsVariantSubmitting] = useState(false);
  // Catalog data for create step 1 (declare before effects that use them)
  type UiCategory = { category_id: number; category_name: string };
  type UiSubCategory = { sub_category_id: string; sub_category_name: string; category_id: number | null };
  type UiBrand = { brand_id: number; brand_name_th: string; brand_name_en: string; brand_code: string };
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [subCategories, setSubCategories] = useState<UiSubCategory[]>([]);
  const [brands, setBrands] = useState<UiBrand[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedMainAttribute, setSelectedMainAttribute] = useState<string>("");
  const [selectedSecondaryAttribute, setSelectedSecondaryAttribute] = useState<string>("");
  const [variantPrice, setVariantPrice] = useState<string>("");
  const [variantIsActive, setVariantIsActive] = useState<boolean>(false);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState<boolean>(false);
  const [newBrandForm, setNewBrandForm] = useState({
    brand_name_th: "",
    brand_name_en: "",
    brand_code: "",
  });
  const [newBrandSubmitting, setNewBrandSubmitting] = useState<boolean>(false);
  const [newBrandError, setNewBrandError] = useState<string | null>(null);
  const [isAddAttributeValueModalOpen, setIsAddAttributeValueModalOpen] = useState<boolean>(false);
  const [newAttributeValueForm, setNewAttributeValueForm] = useState({
    attribute_id: "",
    attribute_value_th: "",
    attribute_value_en: "",
    attribute_value_code: "",
  });
  const [newAttributeValueSubmitting, setNewAttributeValueSubmitting] = useState<boolean>(false);
  const [newAttributeValueError, setNewAttributeValueError] = useState<string | null>(null);
  // Attributes for step 3
  type UiAttribute = { 
    attribute_id: number; 
    attribute_name_th: string; 
    attribute_name_en: string;
    values?: UiAttributeValue[];
  };
  type UiAttributeValue = { 
    attribute_value_id: string; 
    attribute_id: number; 
    attribute_value_th: string; 
    attribute_value_en: string;
    attribute_value_code?: string;
  };
  const [attributes, setAttributes] = useState<UiAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({}); // attribute_id -> attribute_value_id
  const [attributesLoading, setAttributesLoading] = useState<boolean>(false);
  const [attributesError, setAttributesError] = useState<string | null>(null);
  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterSubCategoryId, setFilterSubCategoryId] = useState<string>("all");
  const [filterSubCategories, setFilterSubCategories] = useState<UiSubCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        // ensure categories for filter
        const catsRes = await fetch('/api/categories');
        const catsJson = await catsRes.json();
        if (catsJson?.success && Array.isArray(catsJson.data)) {
          setCategories(catsJson.data);
        }

        let productsUrl = '/api/products?limit=30';
        if (filterCategoryId && filterCategoryId !== 'all') {
          productsUrl += `&category_id=${encodeURIComponent(filterCategoryId)}`;
        }
        if (filterSubCategoryId && filterSubCategoryId !== 'all') {
          productsUrl += `&sub_category_id=${encodeURIComponent(filterSubCategoryId)}`;
        }

        const [imgRes, prodRes] = await Promise.all([
          fetch("/api/r2-objects?limit=50", { cache: "no-store" }),
          fetch(productsUrl, { cache: "no-store" }),
        ]);
        const imgData = await imgRes.json();
        const prodData = await prodRes.json();
        if (!imgData.ok) throw new Error(imgData.error || "Failed to load images");
        if (!prodData.ok) throw new Error(prodData.error || "Failed to load products");
        if (isMounted) {
          setImages(imgData.items || []);
          setServerProducts(prodData.items || []);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [filterCategoryId, filterSubCategoryId]);

  // Fetch subcategories when category filter changes
  useEffect(() => {
    const fetchFilterSubCategories = async () => {
      if (!filterCategoryId || filterCategoryId === 'all') {
        setFilterSubCategories([]);
        setFilterSubCategoryId('all');
        return;
      }
      try {
        const subRes = await fetch(`/api/sub_categories?category_id=${encodeURIComponent(filterCategoryId)}`);
        const subJson = await subRes.json();
        if (subJson.success) {
          setFilterSubCategories(Array.isArray(subJson.data) ? subJson.data : []);
        } else {
          setFilterSubCategories([]);
        }
      } catch (error) {
        console.error('Error fetching subcategories for filter:', error);
        setFilterSubCategories([]);
      }
    };
    fetchFilterSubCategories();
  }, [filterCategoryId]);

  // Load category/subcategory when create modal opens or category changes
  useEffect(() => {
    if (!createOpen) return;
    let active = true;
    (async () => {
      try {
        setCatalogLoading(true);
        setCatalogError(null);
        const catRes = await fetch('/api/categories');
        const catJson = await catRes.json();
        if (!catJson.success) throw new Error(catJson.error || 'โหลดประเภทไม่สำเร็จ');
        if (active) setCategories(Array.isArray(catJson.data) ? catJson.data : []);

        const url = selectedCategoryId ? `/api/sub_categories?category_id=${encodeURIComponent(selectedCategoryId)}` : '/api/sub_categories';
        const subRes = await fetch(url);
        const subJson = await subRes.json();
        if (!subJson.success) throw new Error(subJson.error || 'โหลดหมวดย่อยไม่สำเร็จ');
        if (active) setSubCategories(Array.isArray(subJson.data) ? subJson.data : []);
      } catch (e: any) {
        if (active) setCatalogError(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (active) setCatalogLoading(false);
      }
    })();
    return () => { active = false };
  }, [createOpen, selectedCategoryId]);

  // Load brands when subcategory is selected
  const fetchBrands = async () => {
    if (!createOpen || !selectedSubCategoryId) {
      setBrands([]);
      return;
    }
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const brandRes = await fetch(`/api/brands?subcategory_id=${encodeURIComponent(selectedSubCategoryId)}`);
      const brandJson = await brandRes.json();
      if (!brandJson.success) throw new Error(brandJson.error || 'โหลดแบรนด์ไม่สำเร็จ');
      setBrands(Array.isArray(brandJson.data) ? brandJson.data : []);
    } catch (e: any) {
      setCatalogError(e?.message || 'โหลดแบรนด์ไม่สำเร็จ');
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [createOpen, selectedSubCategoryId]);

  // Fetch all variants for variants table view
  const fetchAllVariants = async () => {
    try {
      setVariantsLoading(true);
      setVariantsError(null);
      const url = variantsFilterCategoryId && variantsFilterCategoryId !== 'all'
        ? `/api/product-variants?limit=10000&category_id=${encodeURIComponent(variantsFilterCategoryId)}`
        : '/api/product-variants?limit=10000';
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok) {
        setVariants(Array.isArray(data.items) ? data.items : []);
      } else {
        setVariants([]);
        setVariantsError(data.error || 'Failed to fetch variants');
      }
    } catch (err) {
      setVariantsError(err instanceof Error ? err.message : 'An error occurred');
      setVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'variants') {
      fetchAllVariants();
    }
  }, [viewMode, variantsFilterCategoryId]);

  const handleAddNewBrand = async () => {
    if (!newBrandForm.brand_name_th.trim() || !newBrandForm.brand_name_en.trim() || !newBrandForm.brand_code.trim()) {
      setNewBrandError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Validate brand_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Z0-9]{3}$/;
    if (!codePattern.test(newBrandForm.brand_code.trim().toUpperCase())) {
      setNewBrandError('รหัสแบรนด์ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น');
      return;
    }

    try {
      setNewBrandSubmitting(true);
      setNewBrandError(null);
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name_th: newBrandForm.brand_name_th.trim(),
          brand_name_en: newBrandForm.brand_name_en.trim(),
          brand_code: newBrandForm.brand_code.trim().toUpperCase(),
          sub_category_id: selectedSubCategoryId || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh brands list
        await fetchBrands();
        // Select the newly created brand
        if (result.data?.brand_id) {
          setSelectedBrandId(String(result.data.brand_id));
          setCreateForm((f) => ({ ...f, brand_id: String(result.data.brand_id) }));
        }
        // Close modal and reset form
        setIsAddBrandModalOpen(false);
        setNewBrandForm({ brand_name_th: "", brand_name_en: "", brand_code: "" });
        setNewBrandError(null);
      } else {
        setNewBrandError(result.error || 'Failed to create brand');
      }
    } catch (err) {
      setNewBrandError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setNewBrandSubmitting(false);
    }
  };

  const handleAddNewAttributeValue = async () => {
    if (!newAttributeValueForm.attribute_id.trim() || !newAttributeValueForm.attribute_value_th.trim() || !newAttributeValueForm.attribute_value_en.trim() || !newAttributeValueForm.attribute_value_code.trim()) {
      setNewAttributeValueError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Validate attribute_value_code: alphanumeric only, exactly 3 characters
    const codePattern = /^[A-Za-z0-9]{3}$/;
    if (!codePattern.test(newAttributeValueForm.attribute_value_code.trim())) {
      setNewAttributeValueError('รหัสคุณสมบัติย่อยต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น');
      return;
    }

    try {
      setNewAttributeValueSubmitting(true);
      setNewAttributeValueError(null);
      const response = await fetch('/api/attribute-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attribute_id: newAttributeValueForm.attribute_id.trim(),
          attribute_value_th: newAttributeValueForm.attribute_value_th.trim(),
          attribute_value_en: newAttributeValueForm.attribute_value_en.trim(),
          attribute_value_code: newAttributeValueForm.attribute_value_code.trim().toUpperCase(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh attributes list to get the new attribute value
        try {
          const attrRes = await fetch('/api/attributes?include_values=true');
          const attrJson = await attrRes.json();
          if (attrJson.ok && Array.isArray(attrJson.items)) {
            setAttributes(attrJson.items);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh attributes:', refreshError);
        }
        // Close modal and reset form
        setIsAddAttributeValueModalOpen(false);
        setNewAttributeValueForm({ attribute_id: "", attribute_value_th: "", attribute_value_en: "", attribute_value_code: "" });
        setNewAttributeValueError(null);
      } else {
        setNewAttributeValueError(result.error || 'Failed to create attribute value');
      }
    } catch (err) {
      setNewAttributeValueError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setNewAttributeValueSubmitting(false);
    }
  };

  // Load attributes when step 3 is reached
  useEffect(() => {
    if (createStep !== 3) return;
    let active = true;
    (async () => {
      try {
        setAttributesLoading(true);
        setAttributesError(null);
        const res = await fetch('/api/attributes?include_values=true');
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'โหลดแอตทริบิวต์ไม่สำเร็จ');
        // Attributes API now includes attribute_value_code, so we can use it directly
        if (active) setAttributes(json.items || []);
      } catch (e: any) {
        if (active) setAttributesError(e?.message || 'โหลดแอตทริบิวต์ไม่สำเร็จ');
      } finally {
        if (active) setAttributesLoading(false);
      }
    })();
    return () => { active = false };
  }, [createStep]);

  const refetchProducts = async () => {
    try {
      setBusy(true);
      setError(null);
      
      let productsUrl = '/api/products?limit=30';
      if (filterCategoryId && filterCategoryId !== 'all') {
        productsUrl += `&category_id=${encodeURIComponent(filterCategoryId)}`;
      }
      if (filterSubCategoryId && filterSubCategoryId !== 'all') {
        productsUrl += `&sub_category_id=${encodeURIComponent(filterSubCategoryId)}`;
      }

      const [imgRes, prodRes] = await Promise.all([
        fetch("/api/r2-objects?limit=50", { cache: "no-store" }),
        fetch(productsUrl, { cache: "no-store" }),
      ]);
      
      const imgData = await imgRes.json();
      const prodData = await prodRes.json();
      
      if (!imgData.ok) throw new Error(imgData.error || "Failed to load images");
      if (!prodData.ok) throw new Error(prodData.error || "Failed to load products");
      
      setImages(imgData.items || []);
      setServerProducts(prodData.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to refresh data");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (): Promise<boolean> => {
    try {
      setBusy(true);
      setError(null); // Clear previous error
      
      // Convert sub_category_id to number or null
      const rawSubCategoryId = createForm.sub_category_id || selectedSubCategoryId || '';
      const subCategoryIdValue = rawSubCategoryId && String(rawSubCategoryId).trim() !== '' 
        ? Number(String(rawSubCategoryId).trim()) 
        : null;
      
      console.log('🔍 DEBUG: Sub Category ID conversion:', {
        raw: rawSubCategoryId,
        string: String(rawSubCategoryId),
        trimmed: String(rawSubCategoryId).trim(),
        final: subCategoryIdValue,
        isNaN: subCategoryIdValue !== null && Number.isNaN(subCategoryIdValue)
      });

      const brandIdValue = selectedBrandId && String(selectedBrandId).trim() !== '' && selectedBrandId !== 'non-brand'
        ? Number(String(selectedBrandId).trim()) 
        : null;

      const payload = {
        product_name_th: createForm.product_name_th?.trim() || '',
        product_name_en: createForm.product_name_en?.trim() || '',
        description: createForm.description?.trim() || null,
        sub_category_id: subCategoryIdValue,
        brand_id: brandIdValue,
      };
      // COMMENTED OUT ALL VALIDATIONS FOR DEBUGGING
      // if (!selectedCategoryId || !selectedSubCategoryId) {
      //   throw new Error("กรุณาเลือกประเภทและหมวดย่อยก่อน");
      // }
      // if (!payload.product_name_th || !payload.product_name_en) {
      //   throw new Error("กรุณากรอกชื่อสินค้า (TH/EN)");
      // }
      // if (payload.product_name_en.length < 3) {
      //   throw new Error("ชื่อสินค้า (EN) ต้องมีอย่างน้อย 3 ตัวอักษรเพื่อสร้าง Base SKU");
      // }
      // Generate SKU before creating product to check for duplicates
      const selectedAttributeValues = Object.values(selectedAttributes).filter(val => val && val !== "");
      
      // Generate SKU using SubcategoryID - BrandCode - AttributeValueCode format
      // Pad SubcategoryID with zeros to 3 digits (e.g., 9 -> 009, 12 -> 012)
      const subCategoryIdPadded = subCategoryIdValue 
        ? String(subCategoryIdValue).padStart(3, '0')
        : "000";
      
      const brandCode = selectedBrandId === 'non-brand' 
        ? "NBR" 
        : (brands.find((b) => String(b.brand_id) === String(selectedBrandId))?.brand_code || "XXX");
      
      // หา attribute code ของคุณสมบัติหลัก (main attribute)
      const mainAttributeValueId = selectedAttributes[selectedMainAttribute];
      let mainAttributeCode = "XX";
      if (mainAttributeValueId) {
        const mainAttr = attributes.find(a => String(a.attribute_id) === selectedMainAttribute);
        const mainAttrValue = mainAttr?.values?.find(v => v.attribute_value_id === mainAttributeValueId);
        if (mainAttrValue?.attribute_value_code) {
          mainAttributeCode = mainAttrValue.attribute_value_code;
        }
      }
      
      // หา attribute codes ของคุณสมบัติรอง (secondary attributes)
      const secondaryAttributeCodes: string[] = [];
      Object.keys(selectedAttributes).forEach(attrId => {
        if (attrId !== selectedMainAttribute) {
          const attr = attributes.find(a => String(a.attribute_id) === attrId);
          const attrValueId = selectedAttributes[attrId];
          const attrValue = attr?.values?.find(v => v.attribute_value_id === attrValueId);
          if (attrValue?.attribute_value_code) {
            secondaryAttributeCodes.push(attrValue.attribute_value_code);
          }
        }
      });
      
      // สร้าง SKU: [รหัสหมวดหมู่] - [รหัสแบรนด์] - [รหัสคุณสมบัติหลัก] - [รหัสคุณสมบัติรอง...]
      let variantSku = `${subCategoryIdPadded}-${brandCode}-${mainAttributeCode}`;
      if (secondaryAttributeCodes.length > 0) {
        variantSku += `-${secondaryAttributeCodes.join('-')}`;
      }
      
      // Check for duplicate SKU before creating product
      const checkSkuRes = await fetch(`/api/product-variants?limit=10000`);
      const checkSkuData = await checkSkuRes.json();
      if (checkSkuData.ok && Array.isArray(checkSkuData.items)) {
        const existingVariant = checkSkuData.items.find((v: any) => v.sku === variantSku);
        if (existingVariant) {
          // Found duplicate SKU - get product details
          const productRes = await fetch(`/api/products?limit=10000`);
          const productData = await productRes.json();
          if (productData.ok && Array.isArray(productData.items)) {
            const duplicateProduct = productData.items.find((p: Product) => 
              p.variants?.some((v: Variant) => v.sku === variantSku)
            );
            if (duplicateProduct) {
              const duplicateVariant = duplicateProduct.variants?.find((v: Variant) => v.sku === variantSku);
              throw new Error(
                `SKU "${variantSku}" ซ้ำกับสินค้าที่มีอยู่แล้ว: "${duplicateProduct.product_name_th || duplicateProduct.product_name}" `
              );
            }
          }
          throw new Error(`SKU "${variantSku}" ซ้ำกับสินค้าที่มีอยู่แล้ว (รหัสความหลากหลาย: ${existingVariant.variant_id})`);
        }
      }
      
      console.log('🔍 DEBUG: Sending payload to API:', payload);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('🔍 DEBUG: API Response:', data);
      if (!data.ok) {
        console.error('❌ ERROR: API returned error:', data.error);
        throw new Error(data.error || "สร้างสินค้าไม่สำเร็จ");
      }
      console.log('✅ SUCCESS: Product created with ID:', data.id);
      
      // Create variant with attributes if product created successfully
      if (data.id) {
        const productId = data.id;
        
        // Create variant with attributes
        // Note: ProductVariantAttributes will only be created if is_active = true
            const variantPayload = {
              product_id: productId,
          attribute_value_ids: selectedAttributeValues.length > 0 ? selectedAttributeValues : [],
          sku: variantSku,
          price: Number(variantPrice || 0),
          is_active: variantIsActive // Will be false by default (no image = not active)
            };
            
            const variantRes = await fetch("/api/product-variants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(variantPayload),
            });
            
            if (!variantRes.ok) {
          const variantError = await variantRes.json();
          throw new Error(variantError.error || 'สร้าง variant ไม่สำเร็จ');
        }
        
        const variantData = await variantRes.json();
        
        // Upload images if provided (use variant SKU with suffix -1, -2, -3, -4)
        if (uploadedImages.length > 0 && variantData.id) {
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            const imageNumber = i + 1;
            const imageSku = `${variantSku}-${imageNumber}`;
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('newName', `${imageSku}.jpg`);
            
            try {
              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              
              const uploadData = await uploadRes.json();
              if (!uploadData.ok) {
                console.warn(`⚠️ Warning: Failed to upload image ${imageNumber}:`, uploadData.error);
              }
            } catch (uploadError) {
              console.warn(`⚠️ Warning: Failed to upload image ${imageNumber}:`, uploadError);
            }
          }
        }
      }
      
      setCreateForm({ product_name_th: "", product_name_en: "", base_price: "", base_sku: "", description: "", sub_category_id: "", brand_id: "" });
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");
      setSelectedBrandId("");
      setSelectedAttributes({});
      setSelectedMainAttribute("");
      setSelectedSecondaryAttribute("");
      setVariantPrice("");
      setVariantIsActive(false);
      setUploadedImages([]);
      setImagePreviews([]);
      setCreateStep(1);
      setStep2ValidationAttempted(false);
      await refetchProducts();
      return true; // Success
    } catch (e: any) {
      setError(e?.message || "สร้างสินค้าไม่สำเร็จ");
      return false; // Failed
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (p: Product) => {
    // Get is_active from first variant (use actual value from database)
    const firstVariant = p.variants?.[0];
    const isActive = firstVariant?.is_active ?? false;
    
    // Load all existing images for this product variant
    const allImages = firstVariant?.sku ? findAllImagesBySku(firstVariant.sku) : [];
    
    setEditForm({ 
      ...p, 
      product_name_th: p.product_name_th || p.product_name, 
      product_name_en: p.product_name_en || p.product_name 
    });
    setEditImagePreview(null);
    setEditUploadedImage(null);
    setEditVariantIsActive(isActive);
    setEditCurrentImages(allImages);
    setEditNewImages([]);
    setEditNewImagePreviews([]);
    setEditImagesToDelete([]);
    setEditOpen(true);
  };

  const openDetail = (p: ProductWithDisplayVariant | Product, variant?: Variant | null) => {
    setDetailProduct(p);
    // Use provided variant, or displayVariant if available, or first variant
    const selectedVariant = variant || ('displayVariant' in p ? p.displayVariant : null) || p.variants?.[0] || null;
    setDetailSelectedVariant(selectedVariant);
    setDetailOpen(true);
  };

  const openDelete = async (p: Product) => {
    setDeleteProduct(p);
    setDeleteOpen(true);
    setDeleteError(null);
    setCheckingInventory(true);
    
    // Check if any variant of this product exists in inventory
    try {
      if (p.variants && p.variants.length > 0) {
        const variantIds = p.variants.map(v => v.variant_id);
        const inventoryChecks = await Promise.all(
          variantIds.map(async (variantId) => {
            try {
              const inventoryRes = await fetch(`/api/inventory?variant_id=${variantId}&limit=1`);
              const inventoryData = await inventoryRes.json();
              if (inventoryData.ok && inventoryData.items && inventoryData.items.length > 0) {
                return { variantId, hasInventory: true, inventoryItem: inventoryData.items[0] };
              }
              return { variantId, hasInventory: false };
            } catch (error) {
              console.error(`Error checking inventory for variant ${variantId}:`, error);
              return { variantId, hasInventory: false };
            }
          })
        );
        
        const variantsWithInventory = inventoryChecks.filter(check => check.hasInventory);
        if (variantsWithInventory.length > 0) {
          const variantSkus = variantsWithInventory
            .map(check => {
              const variant = p.variants?.find(v => v.variant_id === check.variantId);
              return variant?.sku || `Variant ${check.variantId}`;
            })
            .join(', ');
          setDeleteError(`ไม่สามารถลบสินค้านี้ได้ เนื่องจากมีสินค้าอยู่ในสต็อก (${variantSkus}) กรุณาลบสินค้าจากสต็อกก่อน`);
        }
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      setCheckingInventory(false);
    }
  };

  // Generate BASE SKU prefix (BRAND-ATTR) for Step 2 preview
  const generateBaseSkuPrefix = (brandId: string | number | null | undefined) => {
    if (!brandId || brandId === 'non-brand') return "NBR-";
    const selectedBrand = brands.find((b) => String(b.brand_id) === String(brandId));
    const brandCode = selectedBrand?.brand_code || "XXX";
    return `${brandCode}-`;
  };

  // Generate complete BASE SKU in BRAND-ATTR format (for Step 3)
  const generateBaseSku = (brandId: string | number | null | undefined, selectedAttributeValueIds: string[]) => {
    if (!brandId) return "";
    const brandCode = brandId === 'non-brand' 
      ? "NBR" 
      : (brands.find((b) => String(b.brand_id) === String(brandId))?.brand_code || "XXX");
    
    // Get first attribute value code
    let attributeCode = "XX";
    if (selectedAttributeValueIds.length > 0) {
      for (const attrValueId of selectedAttributeValueIds) {
        for (const attr of attributes) {
          const attrValue = attr.values?.find(v => v.attribute_value_id === attrValueId);
          if (attrValue?.attribute_value_code) {
            attributeCode = attrValue.attribute_value_code;
            break;
          }
        }
        if (attributeCode !== "XX") break;
      }
    }
    
    return `${brandCode}-${attributeCode}`;
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 4;
    const maxSizePerFile = 5 * 1024 * 1024; // 5 MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    // Check total files count
    const totalFiles = uploadedImages.length + files.length;
    if (totalFiles > maxFiles) {
      setError(`สามารถอัปโหลดได้สูงสุด ${maxFiles} รูป`);
      event.target.value = '';
      return;
    }

    const newFiles: File[] = [];
    const fileArray = Array.from(files);

    // Validate all files first
    for (const file of fileArray) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(`ไฟล์ ${file.name} ไม่ใช่รูปแบบที่รองรับ (รองรับเฉพาะ JPG, PNG, GIF)`);
        event.target.value = '';
        return;
      }

      // Validate file size
      if (file.size > maxSizePerFile) {
        setError(`ไฟล์ ${file.name} มีขนาดเกิน 5 MB`);
        event.target.value = '';
        return;
      }

      newFiles.push(file);
    }

    if (newFiles.length === 0) {
      event.target.value = '';
      return;
    }

    // Create previews for all files
    const previewPromises = newFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const newPreviews = await Promise.all(previewPromises);
      setUploadedImages([...uploadedImages, ...newFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
      setVariantIsActive(true); // Set to active when images are uploaded
      setError(null);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอ่านไฟล์');
    }

    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
    if (newImages.length === 0) {
      setVariantIsActive(false);
    }
  };

  // Function to find image by BASE SKU (10 characters: XXX-YYY-ZZ format)
  const findImageBySku = (baseSku: string | null) => {
    if (!baseSku) return null;
    
    // Use the full SKU to find matching images
    // Images are stored as "062-CAR-PLN-850.jpg", "062-CAR-PLN-850-1.jpg", etc.
    const baseSkuMatch = baseSku; // Use the SKU as-is from database
    
    // Find the first image that matches the base SKU pattern
    const matchingImage = images.find(img => {
      const imageSku = img.key.split('.')[0]; // Remove file extension
      // Check if image SKU starts with base SKU followed by "-" and a number
      // e.g., "062-CAR-PLN-850-1" matches base SKU "062-CAR-PLN-850"
      // or exact match for base SKU itself
      return imageSku === baseSkuMatch || imageSku.startsWith(baseSkuMatch + '-');
    });
    
    if (matchingImage) {
      console.log(`✅ Found image for SKU ${baseSku}: ${matchingImage.key}`);
    } else {
      console.log(`❌ No image found for SKU ${baseSku}`);
    }
    
    return matchingImage?.url || null;
  };

  // Function to find all images by BASE SKU (including SKU-1, SKU-2, SKU-3, SKU-4)
  const findAllImagesBySku = (baseSku: string | null): string[] => {
    if (!baseSku) return [];
    
    // Extract base SKU (the SKU stored in database, e.g., "062-HIQ-K65")
    // Images are stored as "062-HIQ-K65-1.jpg", "062-HIQ-K65-2.jpg", etc.
    const baseSkuMatch = baseSku; // Use the SKU as-is from database
    
    // Find all images that match the base SKU pattern
    const matchingImages = images
      .filter(img => {
        const imageSku = img.key.split('.')[0]; // Remove file extension
        // Check if image SKU starts with base SKU followed by "-" and a number
        // e.g., "062-HIQ-K65-1" matches base SKU "062-HIQ-K65"
        // or exact match for base SKU itself
        return imageSku === baseSkuMatch || imageSku.startsWith(baseSkuMatch + '-');
      })
      .map(img => ({
        url: img.url,
        key: img.key
      }))
      .filter(item => item.url !== null);
    
    // Sort by SKU suffix to ensure order (base SKU first, then SKU-1, SKU-2, etc.)
    matchingImages.sort((a, b) => {
      const aSku = a.key.split('.')[0];
      const bSku = b.key.split('.')[0];
      
      // If exact match with base SKU, put it first
      if (aSku === baseSkuMatch) return -1;
      if (bSku === baseSkuMatch) return 1;
      
      // Extract suffix number
      const aSuffix = aSku.replace(baseSkuMatch + '-', '');
      const bSuffix = bSku.replace(baseSkuMatch + '-', '');
      const aNum = parseInt(aSuffix) || 999;
      const bNum = parseInt(bSuffix) || 999;
      return aNum - bNum;
    });
    
    return matchingImages.map(item => item.url as string);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    try {
      setBusy(true);
      const payload: any = {
        product_id: editForm.id,
        product_name_th: editForm.product_name_th?.trim() || editForm.product_name?.trim(),
        product_name_en: editForm.product_name_en?.trim() || editForm.product_name?.trim(),
        description: editForm.description || null,
      };
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "แก้ไขสินค้าไม่สำเร็จ");
      setEditOpen(false);
      setEditForm(null);
      await refetchProducts();
    } catch (e: any) {
      setError(e?.message || "แก้ไขสินค้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      setBusy(true);
      
      // Check if any variant of this product exists in inventory
      if (deleteProduct.variants && deleteProduct.variants.length > 0) {
        const variantIds = deleteProduct.variants.map(v => v.variant_id);
        const inventoryChecks = await Promise.all(
          variantIds.map(async (variantId) => {
            try {
              const inventoryRes = await fetch(`/api/inventory?variant_id=${variantId}&limit=1`);
              const inventoryData = await inventoryRes.json();
              if (inventoryData.ok && inventoryData.items && inventoryData.items.length > 0) {
                return { variantId, hasInventory: true, inventoryItem: inventoryData.items[0] };
              }
              return { variantId, hasInventory: false };
            } catch (error) {
              console.error(`Error checking inventory for variant ${variantId}:`, error);
              return { variantId, hasInventory: false };
            }
          })
        );
        
        const variantsWithInventory = inventoryChecks.filter(check => check.hasInventory);
        if (variantsWithInventory.length > 0) {
          const variantSkus = variantsWithInventory
            .map(check => {
              const variant = deleteProduct.variants?.find(v => v.variant_id === check.variantId);
              return variant?.sku || `Variant ${check.variantId}`;
            })
            .join(', ');
          throw new Error(`ไม่สามารถลบสินค้านี้ได้ เนื่องจากมีสินค้าอยู่ในสต็อก (${variantSkus}) กรุณาลบสินค้าจากสต็อกก่อน`);
        }
      }
      
      const res = await fetch(`/api/products?id=${deleteProduct.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ลบสินค้าไม่สำเร็จ");
      setDeleteOpen(false);
      setDeleteProduct(null);
      await refetchProducts();
    } catch (e: any) {
      setError(e?.message || "ลบสินค้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  // Filter products based on search query and subcategory
  const filteredProducts = serverProducts.filter((product) => {
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        product.product_name_th?.toLowerCase().includes(query) ||
        product.product_name_en?.toLowerCase().includes(query) ||
        product.variants?.some(v => v.sku?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Filter by subcategory (if selected and not 'all')
    if (filterSubCategoryId && filterSubCategoryId !== 'all') {
      const selectedSubCategory = filterSubCategories.find(sc => String(sc.sub_category_id) === filterSubCategoryId);
      if (selectedSubCategory) {
        // Match by subcategory name (Thai name)
        const productSubCategoryName = product.sub_categories_name;
        if (productSubCategoryName !== selectedSubCategory.sub_category_name) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Expand products to show each variant separately for display
  type ProductWithDisplayVariant = Product & { displayVariant: Variant | null };
  const expandedProductsForDisplay: ProductWithDisplayVariant[] = filteredProducts.flatMap((product): ProductWithDisplayVariant[] => {
    if (!product.variants || product.variants.length === 0) {
      return [{ ...product, displayVariant: null }];
    }
    // Create a separate display item for each variant
    return product.variants.map((variant): ProductWithDisplayVariant => ({
      ...product,
      displayVariant: variant,
    }));
  });

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* First Row: Title and Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900">จัดการสินค้า</h1>
            <p className="text-sm text-gray-600 mt-0.5">จัดการและแก้ไขข้อมูลสินค้าบนร้านค้า</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* View Toggle Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('picture')}
            className={`h-8 w-8 p-0 ${viewMode === 'picture' ? 'bg-gray-100' : ''}`}
            title="แสดงเป็นรูปภาพ"
          >
            <Grid className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('card')}
            className={`h-8 w-8 p-0 ${viewMode === 'card' ? 'bg-gray-100' : ''}`}
            title="แสดงเป็นรายการ"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('variants')}
            className={`h-8 px-2 text-xs ${viewMode === 'variants' ? 'bg-gray-100' : ''}`}
            title="ความหลากหลายของสินค้า"
          >
            <span className="hidden sm:inline">ความหลากหลาย</span>
            <span className="sm:hidden">Variants</span>
          </Button>
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={refetchProducts}
            disabled={busy}
            className="h-8 w-8 p-0"
            title="รีเฟรชข้อมูลสินค้าและรูปภาพ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          </Button>
          {/* Edit Mode Button */}
          <Button 
            variant="outline" 
            onClick={() => setIsEditMode((p) => !p)}
            className="h-8 flex items-center gap-1.5 text-xs px-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditMode ? "ยกเลิกโหมดแก้ไข" : "โหมดแก้ไข"}</span>
          </Button>
          {/* Add Product Button */}
          <Button 
            onClick={() => {
              setCreateOpen(true);
              setStep2ValidationAttempted(false);
              setCreateStep(1);
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
          </div>
        </div>
        
        {/* Second Row: Search and Category Filter */}
        <div className="flex gap-2 items-center">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อสินค้า"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 w-64 text-xs"
            />
          </div>
          {/* Category Dropdown */}
          <Select value={filterCategoryId} onValueChange={(val: string) => { 
            setFilterCategoryId(val);
            setFilterSubCategoryId('all'); // Reset subcategory when category changes
          }}>
            <SelectTrigger className="h-8 min-w-[200px] w-auto border-gray-300 whitespace-nowrap text-xs">
              <SelectValue placeholder="ทุกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Subcategory Dropdown */}
          {filterCategoryId && filterCategoryId !== 'all' && filterSubCategories.length > 0 && (
            <Select value={filterSubCategoryId} onValueChange={(val: string) => { setFilterSubCategoryId(val); }}>
              <SelectTrigger className="h-8 min-w-[200px] w-auto border-gray-300 whitespace-nowrap text-xs">
                <SelectValue placeholder="ทุกหมวดหมู่ย่อย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่ย่อย</SelectItem>
                {filterSubCategories.map((sc) => (
                  <SelectItem key={sc.sub_category_id} value={String(sc.sub_category_id)}>
                    {sc.sub_category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Edit Mode Notice */}
      {isEditMode && viewMode === 'variants' && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
          คลิกแถวรายการเพื่อแก้ไขข้อมูลความหลากหลายของสินค้า
        </div>
      )}

      {/* Product Display - Conditional based on view mode */}
      {viewMode === 'picture' ? (
        // Picture View - Grid of images only
        <>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {expandedProductsForDisplay.map((product, index) => {
            // Use displayVariant if available, otherwise fallback to first variant
            const displayVariant = product.displayVariant || product.variants?.[0];
            const skuImage = displayVariant?.sku ? findImageBySku(displayVariant.sku) : null;
            const variantImage = displayVariant?.image_url;
            const productImage = skuImage || variantImage;
            
            return (
              <div
                key={`${product.id}-${displayVariant?.variant_id || index}`}
                className="group cursor-pointer relative"
                onClick={() => isEditMode ? openEdit(product) : openDetail(product, product.displayVariant)}
                title={product.product_name}
              >
                <ResponsiveImage
                  src={productImage || ''}
                  alt={product.product_name}
                  aspectRatio="square"
                  objectFit="contain"
                  hoverEffect={true}
                  containerClassName="group-hover:shadow-lg transition-shadow duration-200"
                />
                {/* Minimal overlay info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-end pointer-events-none">
                  <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full">
                    <div className="text-xs font-medium leading-tight break-words line-clamp-2">{product.product_name_th || product.product_name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      ) : viewMode === 'card' ? (
        // Card View - Detailed cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {expandedProductsForDisplay.map((product, index) => {
            // Use displayVariant if available, otherwise fallback to first variant
            const displayVariant = product.displayVariant || product.variants?.[0];
            const skuImage = displayVariant?.sku ? findImageBySku(displayVariant.sku) : null;
            const variantImage = displayVariant?.image_url;
            const productImage = skuImage || variantImage;
            
            return (
              <Card 
                key={`${product.id}-${displayVariant?.variant_id || index}`} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => isEditMode ? openEdit(product) : openDetail(product, product.displayVariant)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col h-full">
                    {/* Product Image */}
                    <ResponsiveImage
                      src={productImage || ''}
                      alt={product.product_name}
                      aspectRatio="square"
                      objectFit="contain"
                      hoverEffect={true}
                    />
                    
                    {/* Product Info */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      <h2 className="text-base font-semibold line-clamp-2">{product.product_name_th || product.product_name}</h2>
                      <div className="flex flex-col gap-1 text-sm text-gray-700">
                        {displayVariant?.sku && (
                          <span className="truncate">SKU: <span className="font-medium">{displayVariant.sku}</span></span>
                        )}
                        {displayVariant && (
                          <span className="text-gray-600">
                            ราคา: <span className="font-bold text-blue-600">
                              {displayVariant.price.toFixed(2)} ฿
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : viewMode === 'variants' ? (
        // Variants Table View
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold">ความหลากหลายของสินค้า (Products)</h2>
              <div className="flex items-center gap-2">
                <Select
                  value={variantsFilterCategoryId}
                  onValueChange={(value: string) => setVariantsFilterCategoryId(value)}
                >
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="กรองตามประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log('Export variants');
                  }}
                  className="h-9 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-sm">ส่งออกข้อมูล</span>
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {variantsLoading ? (
                <div className="text-sm text-gray-600">กำลังโหลดความหลากหลายของสินค้า...</div>
              ) : variantsError ? (
                <div className="text-sm text-red-600">{variantsError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1100px]">
                    <THead>
                      <TR>
                        <TH className="w-16">รหัส</TH>
                        <TH className="w-96">ชื่อสินค้า</TH>
                        <TH>ประเภทย่อย</TH>
                        <TH>คุณสมบัติ</TH>
                        <TH>SKU</TH>
                        <TH>ราคา</TH>
                        <TH>สถานะ</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {variants.length === 0 ? (
                        <TR>
                          <TD colSpan={7} className="text-center text-gray-500 py-8">
                            ไม่พบข้อมูลความหลากหลายของสินค้า
                          </TD>
                        </TR>
                      ) : (
                        variants.map((v) => (
                          <TR 
                            key={v.variant_id}
                            onClick={() => { 
                              if (isEditMode) { 
                                setEditingVariant(v); 
                                setVariantFormData({
                                  price: String(v.price ?? ''),
                                  is_active: !!v.is_active
                                }); 
                                setIsEditVariantModalOpen(true);
                              } 
                            }}
                            className={isEditMode ? 'cursor-pointer hover:bg-accent/40' : ''}
                          >
                            <TD className="w-16">{v.variant_id}</TD>
                            <TD className="w-96">{v.product_name_th || v.product_name}</TD>
                            <TD>{v.sub_category_name_th || '-'}</TD>
                            <TD>
                              {v.attributes && Array.isArray(v.attributes) && v.attributes.length > 0 ? (
                                <div className="space-y-1">
                                  {v.attributes.map((attr: { attribute_name_th: string; attribute_value_th: string }, idx: number) => (
                                    <div key={idx} className="text-sm">
                                      {attr.attribute_name_th}: {attr.attribute_value_th}
                                    </div>
                                  ))}
                                </div>
                              ) : '-'}
                            </TD>
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
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => { 
        setEditOpen(false); 
        setEditForm(null);
        setEditImagePreview(null);
        setEditUploadedImage(null);
        setEditVariantIsActive(true);
        setEditCurrentImages([]);
        setEditNewImages([]);
        setEditNewImagePreviews([]);
        setEditImagesToDelete([]);
      }} title="แก้ไขสินค้า">
        {editForm && (
          <div className="space-y-4">
            {/* Read-only Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">ข้อมูลสินค้า (ไม่สามารถแก้ไขได้)</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">หมวดหมู่ย่อย</Label>
                    <div className="text-gray-900 font-medium">{editForm.sub_categories_name || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">แบรนด์</Label>
                    <div className="text-gray-900 font-medium">
                      {editForm.brand_name_th ? `${editForm.brand_name_th} (${editForm.brand_name_en})` : 'Non-Brand'}
                    </div>
                  </div>
                </div>
                {editForm.variants && editForm.variants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <Label className="text-gray-500 mb-2 block">รหัสสินค้า</Label>
                    <div className="space-y-2">
                      {editForm.variants.map((variant, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-gray-200 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">{variant.sku || `Variant ${variant.variant_id}`}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-blue-600">{variant.price.toFixed(2)} ฿</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">แก้ไขข้อมูลสินค้า</h3>
          <div className="space-y-3">
              <div>
                <Label htmlFor="edit_name_th">ชื่อสินค้า (TH)</Label>
                <Input 
                  id="edit_name_th" 
                  value={editForm.product_name_th || ""} 
                  onChange={(e) => setEditForm((f) => f ? ({ ...f, product_name_th: e.target.value }) : f)} 
                />
              </div>
              <div>
                <Label htmlFor="edit_name_en">ชื่อสินค้า (EN)</Label>
                <Input 
                  id="edit_name_en" 
                  value={editForm.product_name_en || ""} 
                  onChange={(e) => setEditForm((f) => f ? ({ ...f, product_name_en: e.target.value }) : f)} 
                />
              </div>
              <div>
                  <Label htmlFor="edit_desc">รายละเอียด</Label>
                  <Textarea id="edit_desc" value={editForm.description || ""} onChange={(e) => setEditForm((f) => f ? ({ ...f, description: e.target.value }) : f)} />
              </div>
              </div>

              {/* Is Active Buttons */}
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const firstVariant = editForm.variants?.[0];
                  const hasCurrentImage = firstVariant?.sku ? findImageBySku(firstVariant.sku) : null;
                  const hasVariantImage = editForm.variants?.find(v => v.image_url)?.image_url;
                  const hasImage = editImagePreview || editUploadedImage || hasCurrentImage || hasVariantImage;
                  
                  return (
                    <>
                      <Select
                        value={editVariantIsActive ? "true" : "false"}
                        onValueChange={(value: string) => {
                          if (!hasImage) return;
                          setEditVariantIsActive(value === "true");
                        }}
                        disabled={!hasImage}
                      >
                        <SelectTrigger className={!hasImage || busy ? 'opacity-50' : ''}>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">เปิดการใช้งาน</SelectItem>
                          <SelectItem value="false">ปิดการใช้งาน</SelectItem>
                        </SelectContent>
                      </Select>
                      {!hasImage && (
                        <span className="text-xs text-gray-500">(ต้องอัปโหลดรูปภาพก่อน)</span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Image Upload */}
              <div>
                <Label>รูปภาพสินค้า (สูงสุด 4 รูป)</Label>
                <div className="mt-2 space-y-4">
                  {/* Current Images */}
                  {editCurrentImages.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600 mb-2 block">รูปภาพปัจจุบัน</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {editCurrentImages.map((imgUrl, idx) => {
                          if (editImagesToDelete.includes(imgUrl)) return null;
                          // Calculate total remaining images (current - deleted + new)
                          const totalRemainingImages = editCurrentImages.length - editImagesToDelete.length + editNewImages.length;
                          const canDelete = totalRemainingImages > 1;
                          
                          return (
                            <div key={idx} className="relative">
                              <img 
                                src={imgUrl} 
                                alt={`Current ${idx + 1}`} 
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                              />
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditImagesToDelete([...editImagesToDelete, imgUrl]);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                >
                                  ×
                                </button>
                              )}
                              {!canDelete && (
                                <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-not-allowed" title="ต้องมีรูปภาพอย่างน้อย 1 รูป">
                                  ×
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* New Images */}
                  {editNewImagePreviews.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600 mb-2 block">รูปภาพใหม่</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {editNewImagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <img 
                              src={preview} 
                              alt={`New ${idx + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPreviews = [...editNewImagePreviews];
                                const newImages = [...editNewImages];
                                newPreviews.splice(idx, 1);
                                newImages.splice(idx, 1);
                                setEditNewImagePreviews(newPreviews);
                                setEditNewImages(newImages);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {(editCurrentImages.length - editImagesToDelete.length + editNewImages.length) < 4 && (
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const maxFiles = 4 - (editCurrentImages.length - editImagesToDelete.length + editNewImages.length);
                          const filesToAdd = files.slice(0, maxFiles);
                          
                          if (filesToAdd.length === 0) return;
                          
                          // Validate file size (max 5MB each)
                          const validFiles: File[] = [];
                          filesToAdd.forEach(file => {
                            if (file.size > 5 * 1024 * 1024) {
                              setError(`ไฟล์ ${file.name} มีขนาดเกิน 5 MB`);
                              return;
                            }
                            validFiles.push(file);
                          });
                          
                          if (validFiles.length === 0) return;
                          
                          // Generate previews
                          const newPreviews: string[] = [];
                          validFiles.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              newPreviews.push(e.target?.result as string);
                              if (newPreviews.length === validFiles.length) {
                                setEditNewImagePreviews([...editNewImagePreviews, ...newPreviews]);
                                setEditNewImages([...editNewImages, ...validFiles]);
                                setEditVariantIsActive(true);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                      <span className="text-sm text-gray-700">เพิ่มรูปภาพ ({editCurrentImages.length - editImagesToDelete.length + editNewImages.length}/4)</span>
                    </label>
                  )}
                  
                  {(editCurrentImages.length - editImagesToDelete.length + editNewImages.length) >= 4 && (
                    <p className="text-sm text-gray-500">ถึงจำนวนสูงสุดแล้ว (4 รูป)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (editForm) {
                      setEditOpen(false);
                      openDelete(editForm);
                    }
                  }}
                  disabled={busy}
                >
                  ลบสินค้า
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { 
                  setEditOpen(false); 
                  setEditForm(null);
                  setEditImagePreview(null);
                  setEditUploadedImage(null);
                  setEditVariantIsActive(true);
                  setEditCurrentImages([]);
                  setEditNewImages([]);
                  setEditNewImagePreviews([]);
                  setEditImagesToDelete([]);
                }}>ยกเลิก</Button>
                <Button onClick={async () => {
                  if (!editForm) return;
                  try {
                    setBusy(true);
                    const payload: any = {
                      product_id: editForm.id,
                      product_name_th: editForm.product_name_th?.trim() || editForm.product_name?.trim(),
                      product_name_en: editForm.product_name_en?.trim() || editForm.product_name?.trim(),
                      description: editForm.description || null,
                    };
                    const res = await fetch("/api/products", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || "แก้ไขสินค้าไม่สำเร็จ");
                    
                    // Update variant is_active status
                    // Note: ProductVariantAttributes will be managed by API based on is_active change
                    if (editForm.variants && editForm.variants.length > 0) {
                      const firstVariant = editForm.variants[0];
                      if (firstVariant.variant_id) {
                        try {
                          const variantUpdateRes = await fetch("/api/product-variants", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              variant_id: firstVariant.variant_id,
                              is_active: editVariantIsActive,
                              attribute_value_ids: [] // Empty - API will handle deletion when disabling
                            }),
                          });
                          const variantUpdateData = await variantUpdateRes.json();
                          if (!variantUpdateData.ok) {
                            throw new Error(variantUpdateData.error || "อัปเดตสถานะการใช้งานไม่สำเร็จ");
                          }
                        } catch (variantError: any) {
                          throw new Error(variantError?.message || "อัปเดตสถานะการใช้งานไม่สำเร็จ");
                        }
                      }
                    }
                    
                    // Handle image deletion and upload
                    const firstVariant = editForm.variants?.[0];
                    const baseSku = firstVariant?.sku || `${String(editForm.id).padStart(3, '0')}-XXX-XX`;
                    
                    // Delete images marked for deletion from object storage
                    for (const imgUrl of editImagesToDelete) {
                      try {
                        // Extract filename from URL (handle query parameters and path)
                        const urlObj = new URL(imgUrl);
                        const pathParts = urlObj.pathname.split('/');
                        let filename = pathParts[pathParts.length - 1];
                        
                        // Remove query parameters if any
                        if (filename.includes('?')) {
                          filename = filename.split('?')[0];
                        }
                        
                        if (!filename) {
                          console.warn('⚠️ Warning: Could not extract filename from URL:', imgUrl);
                          continue;
                        }
                        
                        const deleteRes = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
                          method: 'DELETE',
                        });
                        const deleteData = await deleteRes.json();
                        if (deleteData.ok) {
                          console.log('✅ Image deleted from object storage:', filename);
                        } else {
                          console.warn('⚠️ Warning: Failed to delete image:', deleteData.error || 'Unknown error');
                        }
                      } catch (deleteError: any) {
                        console.warn('⚠️ Warning: Failed to delete image from object storage:', deleteError?.message || deleteError);
                      }
                    }
                    
                    // Upload new images
                    if (editNewImages.length > 0) {
                      // Find the next available image number
                      const existingImageNumbers = editCurrentImages
                        .filter(img => !editImagesToDelete.includes(img))
                        .map(img => {
                          const urlParts = img.split('/');
                          const filename = urlParts[urlParts.length - 1];
                          const match = filename.match(/-(\d+)\.jpg$/);
                          return match ? parseInt(match[1]) : 0;
                        })
                        .filter(num => num > 0);
                      
                      let nextImageNumber = existingImageNumbers.length > 0 
                        ? Math.max(...existingImageNumbers) + 1 
                        : 1;
                      
                      for (let i = 0; i < editNewImages.length; i++) {
                        const file = editNewImages[i];
                        const imageSku = `${baseSku}-${nextImageNumber}`;
                        nextImageNumber++;
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('newName', `${imageSku}.jpg`);
                        
                        try {
                          const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          const uploadData = await uploadRes.json();
                          if (uploadData.ok) {
                            console.log('✅ New image uploaded:', uploadData.filename);
                          } else {
                            console.warn('⚠️ Warning: Failed to upload image:', uploadData.error);
                          }
                        } catch (uploadError) {
                          console.warn('⚠️ Warning: Failed to upload image:', uploadError);
                        }
                      }
                      
                      // Refresh images list after successful upload
                      try {
                        const imgRes = await fetch("/api/r2-objects?limit=50", { cache: "no-store" });
                        const imgData = await imgRes.json();
                        if (imgData.ok) {
                          setImages(imgData.items || []);
                        }
                      } catch (imgError) {
                        console.warn('⚠️ Warning: Failed to refresh images:', imgError);
                      }
                    }
                    
                    setEditOpen(false);
                    setEditForm(null);
                    setEditImagePreview(null);
                    setEditUploadedImage(null);
                    setEditVariantIsActive(true);
                    setEditCurrentImages([]);
                    setEditNewImages([]);
                    setEditNewImagePreviews([]);
                    setEditImagesToDelete([]);
                    await refetchProducts();
                  } catch (e: any) {
                    setError(e?.message || "แก้ไขสินค้าไม่สำเร็จ");
                  } finally {
                    setBusy(false);
                  }
                }} disabled={busy}>บันทึก</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => {
        setCreateOpen(false);
        setStep2ValidationAttempted(false);
        setCreateStep(1);
        setSelectedCategoryId("");
        setSelectedSubCategoryId("");
        setSelectedBrandId("");
        setCreateForm({ product_name_th: "", product_name_en: "", base_price: "", base_sku: "", description: "", sub_category_id: "", brand_id: "" });
        setSelectedAttributes({});
        setSelectedMainAttribute("");
        setSelectedSecondaryAttribute("");
        setVariantPrice("");
        setVariantIsActive(false);
        setUploadedImages([]);
        setImagePreviews([]);
      }} title="สร้างสินค้าใหม่">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">ขั้นตอน {createStep} / 4</div>
          {createStep === 1 ? (
            <div className="space-y-6">
              {!selectedCategoryId ? (
                // Step 1a: Select Category
              <div>
                  <Label className="text-base font-semibold mb-4 block">เลือกประเภทหลัก</Label>
                  {catalogLoading ? (
                    <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                  ) : catalogError ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{catalogError}</div>
                  ) : (
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                      {categories.map((category) => {
                        return (
                          <button
                            key={category.category_id}
                            onClick={() => setSelectedCategoryId(String(category.category_id))}
                            className="relative bg-white border-2 border-gray-200 rounded-lg px-6 py-4 hover:border-pink-500 hover:shadow-md transition-all duration-200 whitespace-nowrap group"
                          >
                            <span className="text-sm font-medium text-gray-700">{category.category_name}</span>
                          </button>
                        );
                      })}
              </div>
                  )}
                </div>
              ) : (
                // Step 1b: Select Subcategory
              <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedCategoryId("");
                        setSelectedSubCategoryId("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      ← กลับไปเลือกประเภท
                    </button>
                  </div>
                  <Label className="text-base font-semibold mb-4 block">
                    เลือกหมวดย่อย - {categories.find(c => String(c.category_id) === selectedCategoryId)?.category_name}
                  </Label>
                  {catalogLoading ? (
                    <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                  ) : catalogError ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{catalogError}</div>
                  ) : (
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                    {subCategories
                        .filter((sc) => String(sc.category_id || '') === selectedCategoryId)
                        .map((subCategory) => {
                          const isSelected = selectedSubCategoryId === subCategory.sub_category_id;
                          
                          return (
                            <button
                              key={subCategory.sub_category_id}
                              onClick={() => {
                                setSelectedSubCategoryId(subCategory.sub_category_id);
                                setCreateForm((f) => ({ ...f, sub_category_id: subCategory.sub_category_id }));
                              }}
                              className={`relative bg-white border-2 rounded-lg px-6 py-4 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
                                isSelected 
                                  ? 'border-pink-500 bg-pink-50' 
                                  : 'border-gray-200 hover:border-pink-300'
                              }`}
                            >
                              <span className={`text-sm font-medium transition-colors duration-200 ${
                                isSelected ? 'text-pink-700' : 'text-gray-700'
                              }`}>
                                {subCategory.sub_category_name}
                              </span>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
              </div>
              )}
                            </button>
                          );
                        })}
              </div>
                  )}
            </div>
              )}
              {selectedSubCategoryId && (
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    เลือกแบรนด์
                  </Label>
                  {catalogLoading ? (
                    <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                  ) : catalogError ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{catalogError}</div>
                  ) : (
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                      {/* Non-Brand option - always available */}
                      <button
                        onClick={() => {
                          setSelectedBrandId("non-brand");
                          setCreateForm((f) => ({ ...f, brand_id: "" }));
                        }}
                        className={`relative bg-white border-2 rounded-lg px-6 py-4 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
                          selectedBrandId === "non-brand"
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          selectedBrandId === "non-brand" ? 'text-pink-700' : 'text-gray-700'
                        }`}>
                          Non-Brand (NBR)
                        </span>
                        {selectedBrandId === "non-brand" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                </div>
                        )}
                      </button>
                      {/* Brand options - only show if brands exist */}
                      {brands.length > 0 && brands.map((brand) => {
                        const isSelected = selectedBrandId === String(brand.brand_id);
                        return (
                          <button
                            key={brand.brand_id}
                            onClick={() => {
                              setSelectedBrandId(String(brand.brand_id));
                              setCreateForm((f) => ({ ...f, brand_id: String(brand.brand_id) }));
                            }}
                            className={`relative bg-white border-2 rounded-lg px-6 py-4 hover:shadow-md transition-all duration-200 whitespace-nowrap ${
                              isSelected 
                                ? 'border-pink-500 bg-pink-50' 
                                : 'border-gray-200 hover:border-pink-300'
                            }`}
                          >
                            <span className={`text-sm font-medium transition-colors duration-200 ${
                              isSelected ? 'text-pink-700' : 'text-gray-700'
                            }`}>
                              {brand.brand_name_th} ({brand.brand_code})
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                </div>
                            )}
                          </button>
                        );
                      })}
                      {/* Add New Brand Button */}
                      <button
                        onClick={() => setIsAddBrandModalOpen(true)}
                        className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 whitespace-nowrap flex items-center gap-2"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          เพิ่มแบรนด์ใหม่
                        </span>
                      </button>
                    </div>
                  )}
                  {selectedBrandId && (
                    <div className="flex items-center gap-2 pt-4 justify-end border-t border-gray-200 mt-4">
                      <Button 
                        onClick={() => setCreateStep(2)} 
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        ถัดไป
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : createStep === 2 ? (
            <div className="space-y-3">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="product_name_th">ชื่อสินค้า (TH) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="product_name_th" 
                    value={createForm.product_name_th} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, product_name_th: e.target.value }))}
                    className={step2ValidationAttempted && !createForm.product_name_th.trim() ? 'border-red-300' : ''}
                  />
                  {step2ValidationAttempted && !createForm.product_name_th.trim() && (
                    <p className="text-sm text-red-500 mt-1">กรุณากรอกชื่อสินค้า (TH)</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="product_name_en">ชื่อสินค้า (EN) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="product_name_en" 
                    value={createForm.product_name_en} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, product_name_en: e.target.value }))}
                    className={step2ValidationAttempted && (!createForm.product_name_en.trim() || createForm.product_name_en.length < 3) ? 'border-red-300' : ''}
                  />
                  {step2ValidationAttempted && !createForm.product_name_en.trim() ? (
                    <p className="text-sm text-red-500 mt-1">กรุณากรอกชื่อสินค้า (EN)</p>
                  ) : step2ValidationAttempted && createForm.product_name_en.length < 3 && (
                    <p className="text-sm text-red-500 mt-1">ต้องมีอย่างน้อย 3 ตัวอักษรเพื่อสร้าง Base SKU</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea 
                    id="description" 
                    value={createForm.description} 
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setStep2ValidationAttempted(false);
                  setCreateStep(1);
                }}>ย้อนกลับ</Button>
                <Button 
                  onClick={() => {
                    setStep2ValidationAttempted(true);
                    // Validate before proceeding
                    if (!createForm.product_name_th.trim() || 
                        !createForm.product_name_en.trim() || 
                        createForm.product_name_en.length < 3) {
                      return; // Don't proceed if validation fails
                    }
                    setStep2ValidationAttempted(false);
                    setCreateStep(3);
                  }}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  ถัดไป
                </Button>
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </div>
          ) : createStep === 3 ? (
            // Step 3: Select Attributes/Variants
            <div className="space-y-4">
              <div className="text-sm font-bold text-gray-600 mb-4">เพิ่มคุณสมบัติเริ่มต้นของสินค้า</div>
              
              {attributesLoading ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
              ) : attributesError ? (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{attributesError}</div>
              ) : attributes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">ไม่มีแอตทริบิวต์ให้เลือก</p>
                  <p className="text-sm text-gray-400">คุณสามารถข้ามขั้นตอนนี้ได้</p>
            </div>
          ) : (
                <div className="space-y-6">
                  {/* Select Main Attribute */}
                  <div>
                    <Label htmlFor="main_attribute">คุณสมบัติหลัก <span className="text-red-500">*</span></Label>
                    <Select 
                      value={selectedMainAttribute} 
                      onValueChange={(value: string) => {
                        setSelectedMainAttribute(value);
                        // Clear selected attribute value when changing main attribute
                        setSelectedAttributes({});
                        setSelectedSecondaryAttribute("");
                      }}
                    >
                      <SelectTrigger id="main_attribute">
                        <SelectValue placeholder="เลือกคุณสมบัติหลัก" />
                  </SelectTrigger>
                  <SelectContent>
                        {attributes.map((attribute) => (
                          <SelectItem key={attribute.attribute_id} value={String(attribute.attribute_id)}>
                            {attribute.attribute_name_th} ({attribute.attribute_name_en})
                          </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                  {/* Select Sub Attribute (Attribute Value) */}
                  {selectedMainAttribute && (
              <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>คุณสมบัติย่อย <span className="text-red-500">*</span></Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewAttributeValueForm(prev => ({ ...prev, attribute_id: selectedMainAttribute }));
                            setIsAddAttributeValueModalOpen(true);
                          }}
                          className="text-xs h-7 px-2"
                        >
                          + เพิ่มคุณสมบัติย่อย
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {(() => {
                          const selectedAttr = attributes.find(a => String(a.attribute_id) === selectedMainAttribute);
                          if (!selectedAttr || !selectedAttr.values || selectedAttr.values.length === 0) {
                            return <p className="text-sm text-gray-400">ไม่มีค่าที่เลือกได้</p>;
                          }
                          return selectedAttr.values.map((value) => {
                            const isSelected = selectedAttributes[selectedAttr.attribute_id] === value.attribute_value_id;
                            return (
                              <button
                                key={value.attribute_value_id}
                                onClick={() => {
                                  setSelectedAttributes((prev) => {
                                    if (isSelected) {
                                      const newAttrs = { ...prev };
                                      delete newAttrs[selectedAttr.attribute_id];
                                      return newAttrs;
                                    } else {
                                      return { ...prev, [selectedAttr.attribute_id]: value.attribute_value_id };
                                    }
                                  });
                                }}
                                className={`relative px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                                    : 'border-gray-200 hover:border-pink-300 text-gray-700'
                                }`}
                              >
                                <span className="text-sm font-medium">
                                  {value.attribute_value_th} ({value.attribute_value_en})
                                  {value.attribute_value_code && (
                                    <span className="ml-1 text-xs text-gray-500">[{value.attribute_value_code}]</span>
                                  )}
                                </span>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Select Secondary Attributes (ไม่ซ้ำกับ attribute type ที่เลือกไปแล้ว) */}
                  {selectedMainAttribute && Object.keys(selectedAttributes).length > 0 && (
                    <div>
                      <Label>คุณสมบัติรอง (ไม่บังคับ)</Label>
                      <div className="space-y-4 mt-2">
                        {/* Dropdown to select secondary attribute */}
                        <div>
                          <Select 
                            value={selectedSecondaryAttribute} 
                            onValueChange={(value: string) => {
                              setSelectedSecondaryAttribute(value);
                            }}
                          >
                  <SelectTrigger>
                              <SelectValue placeholder="เลือกคุณสมบัติรอง" />
                  </SelectTrigger>
                  <SelectContent>
                              {attributes
                                .filter(attr => String(attr.attribute_id) !== selectedMainAttribute) // กรอง attribute type ที่เลือกไปแล้ว
                                .filter(attr => {
                                  // แสดง attribute ที่ยังไม่ได้เลือก หรือ attribute ที่เลือกอยู่แล้ว (เพื่อให้ dropdown ยังแสดงค่าเดิม)
                                  return !selectedAttributes[attr.attribute_id] || String(attr.attribute_id) === selectedSecondaryAttribute;
                                })
                                .map((attribute) => (
                                  <SelectItem key={attribute.attribute_id} value={String(attribute.attribute_id)}>
                                    {attribute.attribute_name_th} ({attribute.attribute_name_en})
                                  </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

                        {/* Show attribute values when secondary attribute is selected */}
                        {selectedSecondaryAttribute && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>คุณสมบัติย่อย</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewAttributeValueForm(prev => ({ ...prev, attribute_id: selectedSecondaryAttribute }));
                                  setIsAddAttributeValueModalOpen(true);
                                }}
                                className="text-xs h-7 px-2"
                              >
                                + เพิ่มคุณสมบัติย่อย
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {(() => {
                                const selectedAttr = attributes.find(a => String(a.attribute_id) === selectedSecondaryAttribute);
                                if (!selectedAttr || !selectedAttr.values || selectedAttr.values.length === 0) {
                                  return <p className="text-sm text-gray-400">ไม่มีค่าที่เลือกได้</p>;
                                }
                                const selectedValueId = selectedAttributes[selectedAttr.attribute_id];
                                return selectedAttr.values.map((value) => {
                                  const isSelected = selectedValueId === value.attribute_value_id;
                                  return (
                                    <button
                                      key={value.attribute_value_id}
                                      onClick={() => {
                                        setSelectedAttributes((prev) => {
                                          if (isSelected) {
                                            const newAttrs = { ...prev };
                                            delete newAttrs[selectedAttr.attribute_id];
                                            setSelectedSecondaryAttribute(""); // Clear dropdown when deselected
                                            return newAttrs;
                                          } else {
                                            return { ...prev, [selectedAttr.attribute_id]: value.attribute_value_id };
                                          }
                                        });
                                      }}
                                      className={`relative px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                                        isSelected
                                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                                          : 'border-gray-200 hover:border-pink-300 text-gray-700'
                                      }`}
                                    >
                                      <span className="text-sm font-medium">
                                        {value.attribute_value_th} ({value.attribute_value_en})
                                        {value.attribute_value_code && (
                                          <span className="ml-1 text-xs text-gray-500">[{value.attribute_value_code}]</span>
                                        )}
                                      </span>
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
              </div>
                                      )}
                                    </button>
                                  );
                                });
                              })()}
            </div>
                </div>
                  )}
                </div>
                </div>
                  )}

                  {/* Price Input */}
                <div>
                    <Label htmlFor="variant_price">ราคา <span className="text-red-500">*</span></Label>
                  <Input 
                      id="variant_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                      placeholder="กรอกราคา"
                  />
                </div>

                </div>
              )}
              
              {/* SKU Preview */}
              {selectedBrandId && selectedSubCategoryId && selectedMainAttribute && Object.keys(selectedAttributes).length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">SKU ที่จะบันทึก</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {(() => {
                      // Pad SubcategoryID with zeros to 3 digits
                      const subCategoryIdPadded = selectedSubCategoryId 
                        ? String(selectedSubCategoryId).padStart(3, '0')
                        : "000";
                      
                      const brandCode = selectedBrandId === 'non-brand' 
                        ? "NBR" 
                        : (brands.find((b) => String(b.brand_id) === String(selectedBrandId))?.brand_code || "XXX");
                      
                      // หา attribute code ของคุณสมบัติหลัก (main attribute)
                      const mainAttributeValueId = selectedAttributes[selectedMainAttribute];
                      let mainAttributeCode = "XX";
                      if (mainAttributeValueId) {
                        const mainAttr = attributes.find(a => String(a.attribute_id) === selectedMainAttribute);
                        const mainAttrValue = mainAttr?.values?.find(v => v.attribute_value_id === mainAttributeValueId);
                        if (mainAttrValue?.attribute_value_code) {
                          mainAttributeCode = mainAttrValue.attribute_value_code;
                        }
                      }
                      
                      // หา attribute codes ของคุณสมบัติรอง (secondary attributes)
                      const secondaryAttributeCodes: string[] = [];
                      Object.keys(selectedAttributes).forEach(attrId => {
                        if (attrId !== selectedMainAttribute) {
                          const attr = attributes.find(a => String(a.attribute_id) === attrId);
                          const attrValueId = selectedAttributes[attrId];
                          const attrValue = attr?.values?.find(v => v.attribute_value_id === attrValueId);
                          if (attrValue?.attribute_value_code) {
                            secondaryAttributeCodes.push(attrValue.attribute_value_code);
                          }
                        }
                      });
                      
                      // สร้าง SKU: [รหัสหมวดหมู่] - [รหัสแบรนด์] - [รหัสคุณสมบัติหลัก] - [รหัสคุณสมบัติรอง...]
                      let sku = `${subCategoryIdPadded}-${brandCode}-${mainAttributeCode}`;
                      if (secondaryAttributeCodes.length > 0) {
                        sku += `-${secondaryAttributeCodes.join('-')}`;
                      }
                      
                      return sku;
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    รูปแบบ : [รหัสหมวดหมู่] - [รหัสแบรนด์] - [รหัสคุณสมบัติหลัก]{Object.keys(selectedAttributes).some(attrId => attrId !== selectedMainAttribute) ? ' - [รหัสคุณสมบัติรอง...]' : ''}
                  </p>
              </div>
              )}
              
              <div className="flex items-center gap-2 pt-4 justify-end border-t border-gray-200">
                <Button variant="outline" onClick={() => setCreateStep(2)}>ย้อนกลับ</Button>
                <Button 
                  onClick={() => {
                    // Validate before proceeding
                    if (!selectedMainAttribute || Object.keys(selectedAttributes).length === 0 || !variantPrice || Number(variantPrice) <= 0) {
                      return; // Don't proceed if validation fails
                    }
                    setCreateStep(4);
                  }}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          ) : (
            // Step 4: Upload Image
            <div className="space-y-4">
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold mb-1">เกิดข้อผิดพลาด:</div>
                  <div>{error}</div>
                </div>
              )}
              <div className="text-sm text-gray-600 mb-4">อัปโหลดรูปภาพสินค้า</div>
              
              {/* Is Active Dropdown */}
              <div className="mb-4">
                <Label>สถานะการใช้งาน</Label>
                <Select
                  value={variantIsActive ? "true" : "false"}
                  onValueChange={(value: string) => setVariantIsActive(value === "true")}
                  disabled={uploadedImages.length === 0}
                >
                  <SelectTrigger className={uploadedImages.length === 0 ? 'opacity-50' : ''}>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">เปิดการใช้งาน</SelectItem>
                    <SelectItem value="false">ปิดการใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
                {uploadedImages.length === 0 && (
                  <span className="text-xs text-gray-500 mt-1 block">(ต้องอัปโหลดรูปภาพก่อน)</span>
                )}
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-4">
                {uploadedImages.length < 4 && (
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="product-image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025M5 3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm0 0h2a2 2 0 0 0 2-2V1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2Z"/>
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6l-3-3-3 3Z"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">คลิกเพื่ออัปโหลด</span> รูปภาพสินค้า
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG หรือ GIF (รูปละไม่เกิน 5MB, สูงสุด 4 รูป)</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ({uploadedImages.length}/4 รูป)
                        </p>
                      </div>
                      <input 
                        id="product-image" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {imagePreviews.map((preview, index) => {
                        // Generate SKU for this image
                        const subCategoryIdPadded = selectedSubCategoryId 
                          ? String(selectedSubCategoryId).padStart(3, '0')
                          : "000";
                        
                        const brandCode = selectedBrandId === 'non-brand' 
                          ? "NBR" 
                          : (brands.find((b) => String(b.brand_id) === String(selectedBrandId))?.brand_code || "XXX");
                        
                        const mainAttributeValueId = selectedAttributes[selectedMainAttribute];
                        let mainAttributeCode = "XX";
                        if (mainAttributeValueId) {
                          const mainAttr = attributes.find(a => String(a.attribute_id) === selectedMainAttribute);
                          const mainAttrValue = mainAttr?.values?.find(v => v.attribute_value_id === mainAttributeValueId);
                          if (mainAttrValue?.attribute_value_code) {
                            mainAttributeCode = mainAttrValue.attribute_value_code;
                          }
                        }
                        
                        const secondaryAttributeCodes: string[] = [];
                        Object.keys(selectedAttributes).forEach(attrId => {
                          if (attrId !== selectedMainAttribute) {
                            const attr = attributes.find(a => String(a.attribute_id) === attrId);
                            const attrValueId = selectedAttributes[attrId];
                            const attrValue = attr?.values?.find(v => v.attribute_value_id === attrValueId);
                            if (attrValue?.attribute_value_code) {
                              secondaryAttributeCodes.push(attrValue.attribute_value_code);
                            }
                          }
                        });
                        
                        let baseSku = `${subCategoryIdPadded}-${brandCode}-${mainAttributeCode}`;
                        if (secondaryAttributeCodes.length > 0) {
                          baseSku += `-${secondaryAttributeCodes.join('-')}`;
                        }
                        const imageSku = `${baseSku}-${index + 1}`;
                        
                        return (
                          <div key={index} className="flex flex-col items-center space-y-2">
                            <div className="relative">
                              <img 
                                src={preview} 
                                alt={`Product preview ${index + 1}`} 
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 text-center">
                              <span className="font-mono font-semibold">{imageSku}.jpg</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setError(null); // Clear error when going back
                  setCreateStep(3);
                }}>ย้อนกลับ</Button>
                <Button 
                  onClick={async () => { 
                    const success = await handleCreate(); 
                    if (success) { 
                      setCreateOpen(false); 
                      setCreateStep(1);
                      setError(null);
                    } 
                  }} 
                  disabled={busy}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  {busy ? "กำลังสร้าง..." : "เสร็จสิ้น"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Product Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => { 
        setDetailOpen(false); 
        setDetailProduct(null);
        setDetailSelectedVariant(null);
        setSelectedDetailImageIndex(0);
      }} title="รายละเอียดสินค้า">
        {detailProduct && (() => {
          // Use selected variant or fallback to first variant
          const selectedVariant = detailSelectedVariant || detailProduct.variants?.[0];
          const allImages = selectedVariant?.sku ? findAllImagesBySku(selectedVariant.sku) : [];
          const variantImage = selectedVariant?.image_url;
          const productImages = allImages.length > 0 ? allImages : (variantImage ? [variantImage] : []);
          const currentImage = productImages[selectedDetailImageIndex] || productImages[0] || '';
          
          return (
            <div className="space-y-6">
              {/* Product Image */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ResponsiveImage
                    src={currentImage}
                    alt={detailProduct.product_name}
                    aspectRatio="square"
                    objectFit="contain"
                    hoverEffect={false}
                    containerClassName="max-w-xs"
                  />
                </div>
                
                {/* Image Thumbnails (if more than 1 image) */}
                {productImages.length > 1 && (
                  <div className="flex justify-center gap-2 flex-wrap">
                    {productImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDetailImageIndex(index)}
                        className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                          selectedDetailImageIndex === index
                            ? 'border-pink-500 ring-2 ring-pink-200'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                      <img
                        src={img}
                        alt={`${detailProduct.product_name} - รูป ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">{detailProduct.sub_categories_name}</h3>
                <h2 className="text-xl font-semibold text-gray-900">{detailProduct.product_name}</h2>
              </div>

              {/* Read-only Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">ข้อมูลสินค้า</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-500">หมวดหมู่ย่อย</Label>
                      <div className="text-gray-900 font-medium">{detailProduct.sub_categories_name || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-gray-500">แบรนด์</Label>
                      <div className="text-gray-900 font-medium">
                        {detailProduct.brand_name_th ? `${detailProduct.brand_name_th} (${detailProduct.brand_name_en})` : 'Non-Brand'}
                      </div>
                    </div>
                  </div>
                  {detailProduct.variants && detailProduct.variants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <Label className="text-gray-500 mb-2 block">รหัสสินค้า</Label>
                      <div className="space-y-2">
                        {detailProduct.variants.map((variant, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border border-gray-200 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{variant.sku || `Variant ${variant.variant_id}`}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-blue-600">{variant.price.toFixed(2)} ฿</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">รายละเอียด</Label>
                <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 min-h-[100px] whitespace-pre-wrap">
                  {detailProduct.description || '-'}
                </div>
              </div>

            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={() => { 
        setDeleteOpen(false); 
        setDeleteProduct(null);
        setDeleteError(null);
        setCheckingInventory(false);
      }} title="ยืนยันการลบสินค้า">
        {deleteProduct && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">ลบสินค้า</h3>
                <p className="text-sm text-gray-500">การกระทำนี้ไม่สามารถยกเลิกได้</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {(() => {
                    const firstVariant = deleteProduct.variants?.[0];
                    const skuImage = firstVariant?.sku ? findImageBySku(firstVariant.sku) : null;
                    const variantImage = deleteProduct.variants?.find(v => v.image_url)?.image_url;
                    return (
                  <ResponsiveImage
                        src={skuImage || variantImage || ''}
                    alt={deleteProduct.product_name}
                    aspectRatio="square"
                    objectFit="contain"
                    hoverEffect={false}
                    containerClassName="w-12 h-12"
                  />
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{deleteProduct.product_name}</p>
                  {deleteProduct.variants && deleteProduct.variants.length > 0 && (
                    <>
                      {deleteProduct.variants[0]?.sku && (
                        <p className="text-sm text-gray-500">SKU: {deleteProduct.variants[0].sku}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {deleteProduct.variants.length === 1 
                          ? `${deleteProduct.variants[0].price.toFixed(2)} บาท`
                          : `${deleteProduct.variants.length} variants`
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              คุณต้องการลบสินค้า <span className="font-medium">"{deleteProduct.product_name}"</span> หรือไม่?
            </p>

            {checkingInventory && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                กำลังตรวจสอบสต็อกสินค้า...
              </div>
            )}

            {deleteError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="font-semibold mb-1">ไม่สามารถลบสินค้าได้:</div>
                <div>{deleteError}</div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { 
                  setDeleteOpen(false); 
                  setDeleteProduct(null);
                  setDeleteError(null);
                  setCheckingInventory(false);
                }}
                disabled={busy}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={busy || !!deleteError || checkingInventory}
              >
                {busy ? "กำลังลบ..." : "ลบสินค้า"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Brand Modal */}
      <Modal
        isOpen={isAddBrandModalOpen}
        onClose={() => {
          setIsAddBrandModalOpen(false);
          setNewBrandForm({ brand_name_th: "", brand_name_en: "", brand_code: "" });
          setNewBrandError(null);
        }}
        title="เพิ่มแบรนด์ใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="new_brand_name_th">ชื่อแบรนด์ (ไทย) *</Label>
            <Input
              id="new_brand_name_th"
              value={newBrandForm.brand_name_th}
              onChange={(e) => setNewBrandForm({ ...newBrandForm, brand_name_th: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาไทย"
            />
          </div>
          <div>
            <Label htmlFor="new_brand_name_en">ชื่อแบรนด์ (อังกฤษ) *</Label>
            <Input
              id="new_brand_name_en"
              value={newBrandForm.brand_name_en}
              onChange={(e) => setNewBrandForm({ ...newBrandForm, brand_name_en: e.target.value })}
              placeholder="กรอกชื่อแบรนด์ภาษาอังกฤษ"
            />
          </div>
          <div>
            <Label htmlFor="new_brand_code">รหัสแบรนด์ *</Label>
            <Input
              id="new_brand_code"
              value={newBrandForm.brand_code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                setNewBrandForm({ ...newBrandForm, brand_code: value });
              }}
              placeholder="กรอกรหัสแบรนด์ (3 ตัว)"
              maxLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
          </div>
          {newBrandError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {newBrandError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddBrandModalOpen(false);
                setNewBrandForm({ brand_name_th: "", brand_name_en: "", brand_code: "" });
                setNewBrandError(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddNewBrand}
              disabled={newBrandSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {newBrandSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Variant Modal */}
      <Modal
        isOpen={isEditVariantModalOpen}
        onClose={() => { 
          setIsEditVariantModalOpen(false); 
          setEditingVariant(null);
          setVariantFormData({ price: '', is_active: true });
        }}
        title="แก้ไขความหลากหลายของสินค้า"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_variant_id">รหัสความหลากหลาย</Label>
            <Input 
              id="edit_variant_id" 
              value={editingVariant?.variant_id || ''} 
              disabled 
              className="bg-gray-100" 
            />
          </div>
          <div>
            <Label htmlFor="edit_variant_price">ราคา *</Label>
            <Input 
              id="edit_variant_price" 
              type="number" 
              step="0.01" 
              min="0" 
              value={variantFormData.price} 
              onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })} 
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="edit_variant_is_active" 
              checked={variantFormData.is_active} 
              onChange={(e) => setVariantFormData({ ...variantFormData, is_active: e.target.checked })} 
              className="w-4 h-4" 
            />
            <Label htmlFor="edit_variant_is_active" className="cursor-pointer">เปิดใช้งาน</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { 
                setIsEditVariantModalOpen(false); 
                setEditingVariant(null);
                setVariantFormData({ price: '', is_active: true });
              }}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => { 
                setIsEditVariantModalOpen(false); 
                setIsDeleteVariantModalOpen(true); 
              }}
            >
              ลบ
            </Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600" 
              disabled={isVariantSubmitting} 
              onClick={async () => {
                if (!editingVariant) return;
                setIsVariantSubmitting(true);
                try {
                  const res = await fetch('/api/product-variants', { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ 
                      variant_id: editingVariant.variant_id, 
                      price: Number(variantFormData.price), 
                      is_active: variantFormData.is_active 
                    }) 
                  });
                  const json = await res.json();
                  if (json.ok) { 
                    await fetchAllVariants(); 
                    setVariantsError(null); 
                    setIsEditVariantModalOpen(false); 
                    setEditingVariant(null);
                    setVariantFormData({ price: '', is_active: true });
                  } else { 
                    setVariantsError(json.error || 'Failed to update variant'); 
                  }
                } catch (e: any) { 
                  setVariantsError(e?.message || 'An error occurred'); 
                } finally { 
                  setIsVariantSubmitting(false); 
                }
              }}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Variant Modal */}
      <Modal
        isOpen={isDeleteVariantModalOpen}
        onClose={() => { 
          setIsDeleteVariantModalOpen(false); 
          setEditingVariant(null);
        }}
        title="ยืนยันการลบความหลากหลายของสินค้า"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบความหลากหลายรหัส <strong>{editingVariant?.variant_id}</strong> ของสินค้า <strong>{editingVariant?.product_name_th || editingVariant?.product_name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            หากมีการอ้างอิงในสต็อก (Inventories) ระบบจะไม่อนุญาตให้ลบ
          </p>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => { 
                setIsDeleteVariantModalOpen(false); 
                setEditingVariant(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              disabled={isVariantSubmitting} 
              onClick={async () => {
                if (!editingVariant) return;
                setIsVariantSubmitting(true);
                try {
                  const res = await fetch(`/api/product-variants?id=${editingVariant.variant_id}`, { method: 'DELETE' });
                  const json = await res.json();
                  if (json.ok) { 
                    await fetchAllVariants(); 
                    setVariantsError(null); 
                    setIsDeleteVariantModalOpen(false); 
                    setEditingVariant(null);
                  } else { 
                    setVariantsError(json.error || 'Failed to delete variant'); 
                  }
                } catch (e: any) { 
                  setVariantsError(e?.message || 'An error occurred'); 
                } finally { 
                  setIsVariantSubmitting(false); 
                }
              }}
            >
              ลบ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add New Attribute Value Modal */}
      <Modal
        isOpen={isAddAttributeValueModalOpen}
        onClose={() => {
          setIsAddAttributeValueModalOpen(false);
          setNewAttributeValueForm({ attribute_id: "", attribute_value_th: "", attribute_value_en: "", attribute_value_code: "" });
          setNewAttributeValueError(null);
        }}
        title="เพิ่มคุณสมบัติย่อยใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="new_attribute_value_attribute">คุณสมบัติหลัก *</Label>
            <Select
              value={newAttributeValueForm.attribute_id}
              onValueChange={(value: string) => setNewAttributeValueForm({ ...newAttributeValueForm, attribute_id: value })}
            >
              <SelectTrigger id="new_attribute_value_attribute">
                <SelectValue placeholder="เลือกคุณสมบัติหลัก" />
              </SelectTrigger>
              <SelectContent>
                {attributes.map((attribute) => (
                  <SelectItem key={attribute.attribute_id} value={String(attribute.attribute_id)}>
                    {attribute.attribute_name_th} ({attribute.attribute_name_en})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="new_attribute_value_th">ชื่อคุณสมบัติย่อย (ไทย) *</Label>
            <Input
              id="new_attribute_value_th"
              value={newAttributeValueForm.attribute_value_th}
              onChange={(e) => setNewAttributeValueForm({ ...newAttributeValueForm, attribute_value_th: e.target.value })}
              placeholder="กรอกชื่อคุณสมบัติย่อยภาษาไทย"
            />
          </div>
          <div>
            <Label htmlFor="new_attribute_value_en">ชื่อคุณสมบัติย่อย (อังกฤษ) *</Label>
            <Input
              id="new_attribute_value_en"
              value={newAttributeValueForm.attribute_value_en}
              onChange={(e) => setNewAttributeValueForm({ ...newAttributeValueForm, attribute_value_en: e.target.value })}
              placeholder="กรอกชื่อคุณสมบัติย่อยภาษาอังกฤษ"
            />
          </div>
          <div>
            <Label htmlFor="new_attribute_value_code">รหัสคุณสมบัติย่อย *</Label>
            <Input
              id="new_attribute_value_code"
              value={newAttributeValueForm.attribute_value_code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                setNewAttributeValueForm({ ...newAttributeValueForm, attribute_value_code: value });
              }}
              placeholder="กรอกรหัสคุณสมบัติย่อย (3 ตัว)"
              maxLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข 3 ตัวเท่านั้น
            </p>
          </div>
          {newAttributeValueError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {newAttributeValueError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddAttributeValueModalOpen(false);
                setNewAttributeValueForm({ attribute_id: "", attribute_value_th: "", attribute_value_en: "", attribute_value_code: "" });
                setNewAttributeValueError(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddNewAttributeValue}
              disabled={newAttributeValueSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {newAttributeValueSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
