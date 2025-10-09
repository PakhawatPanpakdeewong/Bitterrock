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
import { Grid, List } from "lucide-react";

type Variant = {
  variant_id: number;
  variant_name: string;
  sku: string | null;
  price: number;
  description?: string;
  image_url?: string | null;
};

type Product = {
  id: number;
  sub_categories_name: string | null;
  product_name: string; // using TH name from API (for backward compatibility)
  product_name_th: string;
  product_name_en: string;
  description: string | null;
  base_sku: string | null;
  base_price: number;
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
  });
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [editForm, setEditForm] = useState<null | (Product & {
    product_name_th?: string;
    product_name_en?: string;
  })>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

  const [serverProducts, setServerProducts] = useState<Product[]>(mockProducts);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'picture' | 'card'>('card');
  // Catalog data for create step 1 (declare before effects that use them)
  type UiCategory = { category_id: number; category_name: string };
  type UiSubCategory = { sub_category_id: string; sub_category_name: string; category_id: number | null };
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [subCategories, setSubCategories] = useState<UiSubCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
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
  };
  const [attributes, setAttributes] = useState<UiAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({}); // attribute_id -> attribute_value_id
  const [attributesLoading, setAttributesLoading] = useState<boolean>(false);
  const [attributesError, setAttributesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [imgRes, prodRes] = await Promise.all([
          fetch("/api/r2-objects?limit=50", { cache: "no-store" }),
          fetch("/api/products?limit=30", { cache: "no-store" }),
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
  }, []);

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
      const res = await fetch("/api/products?limit=30", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load products");
      setServerProducts(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    }
  };

  const handleCreate = async () => {
    try {
      setBusy(true);
      const payload = {
        product_name_th: createForm.product_name_th.trim(),
        product_name_en: createForm.product_name_en.trim(),
        base_price: Number(createForm.base_price || 0),
        base_sku: (() => {
          if (!selectedSubCategoryId || !createForm.product_name_en) return null;
          const prefix = selectedSubCategoryId;
          const suffix = createForm.product_name_en.substring(0, 3).toUpperCase();
          return `${prefix}-${suffix}`;
        })(),
        description: createForm.description.trim() || null,
        sub_category_id: (createForm.sub_category_id || selectedSubCategoryId || '').trim() || null,
      };
      if (!selectedCategoryId || !selectedSubCategoryId) {
        throw new Error("กรุณาเลือกประเภทและหมวดย่อยก่อน");
      }
      if (!payload.product_name_th || !payload.product_name_en) {
        throw new Error("กรุณากรอกชื่อสินค้า (TH/EN)");
      }
      if (payload.product_name_en.length < 3) {
        throw new Error("ชื่อสินค้า (EN) ต้องมีอย่างน้อย 3 ตัวอักษรเพื่อสร้าง Base SKU");
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "สร้างสินค้าไม่สำเร็จ");
      
      // If product created successfully and we have selected attributes, create variants
      if (data.id && Object.keys(selectedAttributes).some(key => selectedAttributes[key])) {
        const productId = data.id;
        const selectedAttributeValues = Object.values(selectedAttributes).filter(val => val && val !== "");
        
        if (selectedAttributeValues.length > 0) {
          // Create a variant for each selected attribute value
          for (const attributeValueId of selectedAttributeValues) {
            const variantPayload = {
              product_id: productId,
              attribute_value_id: attributeValueId,
              sku: `${selectedSubCategoryId}-${createForm.product_name_en.substring(0, 3).toUpperCase()}-${attributeValueId}`,
              price: Number(createForm.base_price || 0),
              image_url: null,
              is_active: true
            };
            
            const variantRes = await fetch("/api/product-variants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(variantPayload),
            });
            
            if (!variantRes.ok) {
              console.warn(`Failed to create variant for attribute ${attributeValueId}`);
            }
          }
        }
      }
      
      setCreateForm({ product_name_th: "", product_name_en: "", base_price: "", base_sku: "", description: "", sub_category_id: "" });
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");
      setSelectedAttributes({});
      setCreateStep(1);
      await refetchProducts();
    } catch (e: any) {
      setError(e?.message || "สร้างสินค้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditForm({ 
      ...p, 
      product_name_th: p.product_name_th || p.product_name, 
      product_name_en: p.product_name_en || p.product_name 
    });
    setEditOpen(true);
  };

  const openDetail = (p: Product) => {
    setDetailProduct(p);
    setDetailOpen(true);
  };

  const openDelete = (p: Product) => {
    setDeleteProduct(p);
    setDeleteOpen(true);
  };

  // Function to find image by BASE SKU (first 8 characters only)
  const findImageBySku = (baseSku: string | null) => {
    if (!baseSku) return null;
    
    // Take only first 8 characters of the BASE SKU
    const skuPrefix = baseSku.substring(0, 8);
    
    // Look for image with matching SKU prefix
    const matchingImage = images.find(img => {
      // Extract SKU from image key and take first 8 characters
      const imageSku = img.key.split('.')[0]; // Remove file extension
      const imageSkuPrefix = imageSku.substring(0, 8);
      return imageSkuPrefix === skuPrefix;
    });
    
    if (matchingImage) {
      console.log(`✅ Found image for SKU ${baseSku} (prefix: ${skuPrefix}): ${matchingImage.key}`);
    } else {
      console.log(`❌ No image found for SKU ${baseSku} (prefix: ${skuPrefix})`);
    }
    
    return matchingImage?.url || null;
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    try {
      setBusy(true);
      const payload: any = {
        product_id: editForm.id,
        product_name_th: editForm.product_name_th?.trim() || editForm.product_name?.trim(),
        product_name_en: editForm.product_name_en?.trim() || editForm.product_name?.trim(),
        base_sku: editForm.base_sku || null,
        description: editForm.description || null,
        base_price: editForm.base_price,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">สินค้าทั้งหมด</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setCreateOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            เพิ่มสินค้า
          </Button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('picture')}
              className={`rounded-none border-0 ${
                viewMode === 'picture' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('card')}
              className={`rounded-none border-0 ${
                viewMode === 'card' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button variant={isEditMode ? "secondary" : "outline"} onClick={() => setIsEditMode((p) => !p)}>
            {isEditMode ? "ยกเลิกโหมดแก้ไข" : "โหมดแก้ไข"}
          </Button>
        </div>
      </div>
      

      {/* Product Display - Conditional based on view mode */}
      {viewMode === 'picture' ? (
        // Picture View - Grid of images only
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {serverProducts.map((product) => {
            // Try to find image by BASE SKU first, then fallback to variant image
            const skuImage = findImageBySku(product.base_sku);
            const variantImage = product.variants?.find(v => v.image_url)?.image_url;
            const productImage = skuImage || variantImage;
            
            return (
              <div
                key={product.id}
                className="group cursor-pointer relative"
                onClick={() => isEditMode ? openEdit(product) : openDetail(product)}
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
                    <div className="text-xs font-medium leading-tight break-words line-clamp-2">{product.product_name}</div>
                    <div className="text-xs mt-1 font-semibold">{product.base_price.toFixed(2)} บาท</div>
                    {product.base_sku && (
                      <div className="text-xs mt-1 opacity-75">SKU: {product.base_sku}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Card View - Detailed cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {serverProducts.map((product) => {
            // Try to find image by BASE SKU first, then fallback to variant image
            const skuImage = findImageBySku(product.base_sku);
            const variantImage = product.variants?.find(v => v.image_url)?.image_url;
            const productImage = skuImage || variantImage;
            
            return (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => isEditMode ? openEdit(product) : openDetail(product)}
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
                      <h3 className="text-sm font-medium text-gray-700">{product.sub_categories_name}</h3>
                      <h2 className="text-base font-semibold line-clamp-2">{product.product_name}</h2>
                      <p className="text-gray-600 text-xs line-clamp-3 flex-1">{product.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-700">
                        <span className="truncate">SKU: <span className="font-medium">{product.base_sku}</span></span>
                        <span className="font-bold text-blue-600">{product.base_price.toFixed(2)} บาท</span>
                      </div>
                      
                    {/* Variants count only */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {product.variants.length} รูปแบบ
                      </div>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setEditForm(null); }} title="แก้ไขสินค้า">
        {editForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Label htmlFor="edit_sku">Base SKU</Label>
                <Input 
                  id="edit_sku" 
                  value={editForm.base_sku || ""} 
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="Auto-generated SKU"
                />
              </div>
              <div>
                <Label htmlFor="edit_price">ราคาเริ่มต้น</Label>
                <Input id="edit_price" type="number" step="0.01" value={String(editForm.base_price)} onChange={(e) => setEditForm((f) => f ? ({ ...f, base_price: Number(e.target.value || 0) }) : f)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="edit_desc">รายละเอียด</Label>
                <Textarea id="edit_desc" value={editForm.description || ""} onChange={(e) => setEditForm((f) => f ? ({ ...f, description: e.target.value }) : f)} />
              </div>
            </div>
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
                <Button variant="outline" onClick={() => { setEditOpen(false); setEditForm(null); }}>ยกเลิก</Button>
                <Button onClick={handleEditSave} disabled={busy}>บันทึก</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="สร้างสินค้าใหม่">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">ขั้นตอน {createStep} / 3</div>
          {createStep === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>ประเภทหลัก</Label>
                <Select value={selectedCategoryId} onValueChange={(val: string) => { setSelectedCategoryId(val); setSelectedSubCategoryId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={catalogLoading ? "กำลังโหลด..." : "เลือกประเภท"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>หมวดย่อย</Label>
                <Select value={selectedSubCategoryId} onValueChange={(val: string) => { setSelectedSubCategoryId(val); setCreateForm((f) => ({ ...f, sub_category_id: val })); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCategoryId ? (catalogLoading ? "กำลังโหลด..." : "เลือกหมวดย่อย") : "เลือกประเภทก่อน"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories
                      .filter((sc) => !selectedCategoryId || String(sc.category_id || '') === selectedCategoryId)
                      .map((sc) => (
                        <SelectItem key={sc.sub_category_id} value={sc.sub_category_id}>{sc.sub_category_name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {catalogError && (
                <div className="md:col-span-2 text-sm text-red-600">{catalogError}</div>
              )}
              <div className="md:col-span-2 flex items-center gap-2 pt-2 justify-end">
                <Button onClick={() => setCreateStep(2)} disabled={!selectedCategoryId || !selectedSubCategoryId}>ถัดไป</Button>
              </div>
            </div>
          ) : createStep === 2 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="product_name_th">ชื่อสินค้า (TH)</Label>
                  <Input id="product_name_th" value={createForm.product_name_th} onChange={(e) => setCreateForm((f) => ({ ...f, product_name_th: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="product_name_en">ชื่อสินค้า (EN)</Label>
                  <Input id="product_name_en" value={createForm.product_name_en} onChange={(e) => setCreateForm((f) => ({ ...f, product_name_en: e.target.value }))} />
                  {createForm.product_name_en && createForm.product_name_en.length < 3 && (
                    <p className="text-sm text-red-500 mt-1">ต้องมีอย่างน้อย 3 ตัวอักษรเพื่อสร้าง Base SKU</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="base_price">ราคาเริ่มต้น</Label>
                  <Input id="base_price" type="number" step="0.01" value={createForm.base_price} onChange={(e) => setCreateForm((f) => ({ ...f, base_price: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="base_sku">Base SKU (Auto-generated)</Label>
                  <Input 
                    id="base_sku" 
                    value={(() => {
                      if (!selectedSubCategoryId || !createForm.product_name_en) return "";
                      const prefix = selectedSubCategoryId;
                      const suffix = createForm.product_name_en.substring(0, 3).toUpperCase();
                      return `${prefix}-${suffix}`;
                    })()} 
                    readOnly 
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="Select subcategory and enter product name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea id="description" value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 justify-end">
                <Button variant="outline" onClick={() => setCreateStep(1)}>ย้อนกลับ</Button>
                <Button onClick={() => setCreateStep(3)} disabled={!createForm.product_name_th || !createForm.product_name_en || createForm.product_name_en.length < 3}>ถัดไป</Button>
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">เลือกแอตทริบิวต์และค่าที่ต้องการ (ไม่บังคับ)</div>
              {attributesLoading ? (
                <div className="text-sm text-gray-500">กำลังโหลดแอตทริบิวต์...</div>
              ) : attributesError ? (
                <div className="text-sm text-red-600">{attributesError}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributes.map((attr) => (
                    <div key={attr.attribute_id} className="space-y-2">
                      <Label className="text-sm font-medium">{attr.attribute_name_th}</Label>
                      <Select 
                        value={selectedAttributes[attr.attribute_id] || "none"} 
                        onValueChange={(value: string) => {
                          setSelectedAttributes(prev => ({
                            ...prev,
                            [attr.attribute_id]: value === "none" ? "" : value
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกค่าที่ต้องการ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ไม่เลือก</SelectItem>
                          {attr.values?.map((value) => (
                            <SelectItem key={value.attribute_value_id} value={value.attribute_value_id}>
                              {value.attribute_value_th}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 justify-end">
                <Button variant="outline" onClick={() => setCreateStep(2)}>ย้อนกลับ</Button>
                <Button onClick={async () => { await handleCreate(); if (!error) { setCreateOpen(false); setCreateStep(1); } }} disabled={busy}>เสร็จสิ้น</Button>
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Product Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setDetailProduct(null); }} title="รายละเอียดสินค้า">
        {detailProduct && (
          <div className="space-y-6">
            {/* Product Image */}
            <div className="flex justify-center">
              <ResponsiveImage
                src={findImageBySku(detailProduct.base_sku) || detailProduct.variants?.find(v => v.image_url)?.image_url || ''}
                alt={detailProduct.product_name}
                aspectRatio="square"
                objectFit="contain"
                hoverEffect={false}
                containerClassName="max-w-xs"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">{detailProduct.sub_categories_name}</h3>
                <h2 className="text-xl font-semibold text-gray-900">{detailProduct.product_name}</h2>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">{detailProduct.description}</p>

              <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
                <span className="text-sm text-gray-700">SKU: <span className="font-medium">{detailProduct.base_sku}</span></span>
                <span className="text-lg font-bold text-blue-600">{detailProduct.base_price.toFixed(2)} บาท</span>
              </div>

              {/* Variants Detail */}
              {detailProduct.variants && detailProduct.variants.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-900">
                    รูปแบบที่มี ({detailProduct.variants.length} รูปแบบ)
                  </h4>
                  <div className="grid gap-3">
                    {detailProduct.variants.map((variant) => (
                      <div key={variant.variant_id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{variant.variant_name}</div>
                            <div className="text-sm text-gray-600">SKU: {variant.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">{variant.price.toFixed(2)} บาท</div>
                            {variant.image_url && (
                              <div className="mt-2">
                                <ResponsiveImage
                                  src={variant.image_url}
                                  alt={variant.variant_name}
                                  aspectRatio="square"
                                  objectFit="contain"
                                  hoverEffect={true}
                                  containerClassName="w-16 h-16"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteProduct(null); }} title="ยืนยันการลบสินค้า">
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
                  <ResponsiveImage
                    src={findImageBySku(deleteProduct.base_sku) || deleteProduct.variants?.find(v => v.image_url)?.image_url || ''}
                    alt={deleteProduct.product_name}
                    aspectRatio="square"
                    objectFit="contain"
                    hoverEffect={false}
                    containerClassName="w-12 h-12"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{deleteProduct.product_name}</p>
                  <p className="text-sm text-gray-500">SKU: {deleteProduct.base_sku}</p>
                  <p className="text-sm text-gray-500">{deleteProduct.base_price.toFixed(2)} บาท</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              คุณต้องการลบสินค้า <span className="font-medium">"{deleteProduct.product_name}"</span> หรือไม่?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setDeleteOpen(false); setDeleteProduct(null); }}
                disabled={busy}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={busy}
              >
                {busy ? "กำลังลบ..." : "ลบสินค้า"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
