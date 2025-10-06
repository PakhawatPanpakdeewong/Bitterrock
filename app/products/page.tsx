"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Variant = {
  variant_id: number;
  variant_name: string;
  sku: string;
  price: number;
  description?: string;
};

type Product = {
  id: number;
  sub_categories_name: string;
  product_name: string;
  description: string;
  base_sku: string;
  base_price: number;
  variants: Variant[];
};

const mockProducts: Product[] = [];

type R2Item = { key: string; url: string | null };

export default function ProductsPage() {
  const [images, setImages] = useState<R2Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});

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
        if (isMounted) setError(e?.message || "Failed to load images");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const [serverProducts, setServerProducts] = useState<Product[]>(mockProducts);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">สินค้าทั้งหมด</h1>
      
      {/* R2 images preview row */}
      <div className="flex gap-3 overflow-x-auto py-2">
        {loading ? (
          <span className="text-sm text-gray-500">กำลังโหลดรูปภาพจากคลัง...</span>
        ) : error ? (
          <span className="text-sm text-red-600">{error}</span>
        ) : images.length === 0 ? (
          <span className="text-sm text-gray-500">ไม่พบรูปภาพในบัคเก็ต</span>
        ) : (
          images.map((img) => (
            <div key={img.key} className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              {img.url ? (
                <img src={img.url} alt={img.key} className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-[10px] text-gray-500 px-1 text-center break-words">{img.key}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serverProducts.map((product) => {
          const isOpen = !!open[product.id];
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
                    <div className="pt-2">
                      <Button
                        variant={isOpen ? "outline" : "default"}
                        size="sm"
                        onClick={() => setOpen((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                      >
                        {isOpen ? "ซ่อนตัวเลือก (Variants)" : "แสดงตัวเลือก (Variants)"}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded content: variants with images */}
                  {isOpen && (
                    <div className="p-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.variants.map((v, idx) => {
                          const img = images[(idx % Math.max(1, images.length))];
                          return (
                            <div key={v.variant_id} className="flex gap-3 p-3 rounded-md bg-white border">
                              <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                {img?.url ? (
                                  <img src={img.url} alt={v.sku} className="w-14 h-14 object-contain" />
                                ) : (
                                  <span className="text-[10px] text-gray-500 px-1 text-center break-words">ไม่มีรูป</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{v.variant_name}</div>
                                <div className="text-xs text-gray-600 truncate">SKU: {v.sku}</div>
                                <div className="text-sm font-semibold text-blue-600">{v.price.toFixed(2)} บาท</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
