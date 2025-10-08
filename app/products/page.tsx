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

type Variant = {
  variant_id: number;
  variant_name: string;
  sku: string | null;
  price: number;
  description?: string;
};

type Product = {
  id: number;
  sub_categories_name: string | null;
  product_name: string; // using TH name from API
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

  const [serverProducts, setServerProducts] = useState<Product[]>(mockProducts);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
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
    setEditForm({ ...p, product_name_th: p.product_name, product_name_en: p.product_name });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    try {
      setBusy(true);
      const payload: any = {
        product_id: editForm.id,
        product_name_th: editForm.product_name_th?.trim(),
        product_name_en: editForm.product_name_en?.trim(),
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

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("ยืนยันการลบสินค้านี้?");
    if (!confirmDelete) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ลบสินค้าไม่สำเร็จ");
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
          <Button onClick={() => setCreateOpen(true)}>เพิ่มสินค้า</Button>
          <Button variant={isEditMode ? "secondary" : "outline"} onClick={() => setIsEditMode((p) => !p)}>
            {isEditMode ? "ยกเลิกโหมดแก้ไข" : "โหมดแก้ไข"}
          </Button>
        </div>
      </div>
      
      {/* R2 images preview grid: 10 items per row, wraps to next rows */}
      <div className="grid grid-cols-10 gap-2 py-4">
        {loading ? (
          <span className="text-sm text-gray-500">กำลังโหลดรูปภาพจากคลัง...</span>
        ) : error ? (
          <span className="text-sm text-red-600">{error}</span>
        ) : images.length === 0 ? (
          <span className="text-sm text-gray-500">ไม่พบรูปภาพในบัคเก็ต</span>
        ) : (
          images.map((img) => (
            <div key={img.key} className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
              {img.url ? (
                <img src={img.url} alt={img.key} className="w-24 h-24 object-contain" />
              ) : (
                <span className="text-[10px] text-gray-500 px-1 text-center break-words">{img.key}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serverProducts.map((product) => {
          return (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Collapsed header: show info only, no images */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">{product.sub_categories_name}</h3>
                    <h2 className="text-base font-semibold line-clamp-2">{product.product_name}</h2>
                    <p className="text-gray-600 text-xs line-clamp-3">{product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <span>SKU: <span className="font-medium">{product.base_sku}</span></span>
                      <span>ราคา: <span className="font-bold text-blue-600">{product.base_price.toFixed(2)} บาท</span></span>
                    </div>
                    {isEditMode && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(product)}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          disabled={busy}
                        >
                          ลบ
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setEditForm(null); }} title="แก้ไขสินค้า">
        {editForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit_name_th">ชื่อสินค้า (TH)</Label>
                <Input id="edit_name_th" value={editForm.product_name_th || ""} onChange={(e) => setEditForm((f) => f ? ({ ...f, product_name_th: e.target.value }) : f)} />
              </div>
              <div>
                <Label htmlFor="edit_name_en">ชื่อสินค้า (EN)</Label>
                <Input id="edit_name_en" value={editForm.product_name_en || ""} onChange={(e) => setEditForm((f) => f ? ({ ...f, product_name_en: e.target.value }) : f)} />
              </div>
              <div>
                <Label htmlFor="edit_sku">Base SKU</Label>
                <Input id="edit_sku" value={editForm.base_sku || ""} onChange={(e) => setEditForm((f) => f ? ({ ...f, base_sku: e.target.value }) : f)} />
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
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleEditSave} disabled={busy}>บันทึก</Button>
              <Button variant="outline" onClick={() => { setEditOpen(false); setEditForm(null); }}>ยกเลิก</Button>
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
    </div>
  );
}
