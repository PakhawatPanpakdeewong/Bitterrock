'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Warehouse as WarehouseIcon,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

type InventoryItem = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  product_name_th: string;
  product_name_en: string;
  base_sku: string | null;
  variant_sku: string | null;
  warehouse_name: string;
  variant_name: string | null;
  sku: string | null;
  product_name: string;
};

type Warehouse = {
  warehouseid: number;
  warehousename: string;
  locationaddress: string;
  contactperson: string | null;
};

type Product = {
  id: number;
  product_name_th: string;
  product_name_en: string;
  base_sku: string | null;
  variants: Array<{
    variant_id: number;
    variant_name: string;
    sku: string | null;
  }>;
};

export default function WarehouseStockPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, low, out
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    warehouse_id: '',
    stock_quantity: '',
    reserved_quantity: '0',
    expired_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouses
      const warehousesRes = await fetch('/api/warehouses');
      const warehousesData = await warehousesRes.json();
      if (warehousesData.ok) {
        setWarehouses(warehousesData.items || []);
      } else {
        // Fallback to empty array if API fails
        setWarehouses([]);
      }

      // Fetch products
      const productsRes = await fetch('/api/products?limit=100');
      const productsData = await productsRes.json();
      if (productsData.ok) {
        setProducts(productsData.items || []);
      }

      // Fetch inventory
      const inventoryRes = await fetch('/api/inventory?limit=100');
      const inventoryData = await inventoryRes.json();
      if (inventoryData.ok) {
        setInventoryItems(inventoryData.items || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.product_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = warehouseFilter === 'all' || String(item.warehouse_id) === warehouseFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = item.available_quantity <= 10;
    } else if (stockFilter === 'out') {
      matchesStock = item.available_quantity === 0;
    }
    
    return matchesSearch && matchesWarehouse && matchesStock;
  });

  const openAddModal = () => {
    setFormData({
      product_id: '',
      variant_id: '',
      warehouse_id: '',
      stock_quantity: '',
      reserved_quantity: '0',
      expired_date: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_id: String(item.product_id),
      variant_id: item.variant_id ? String(item.variant_id) : '',
      warehouse_id: String(item.warehouse_id),
      stock_quantity: String(item.stock_quantity),
      reserved_quantity: String(item.reserved_quantity),
      expired_date: item.expired_date ? item.expired_date.split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        inventory_id: editingItem?.inventory_id,
        product_id: Number(formData.product_id),
        variant_id: formData.variant_id ? Number(formData.variant_id) : null,
        warehouse_id: Number(formData.warehouse_id),
        stock_quantity: Number(formData.stock_quantity),
        reserved_quantity: Number(formData.reserved_quantity),
        expired_date: formData.expired_date || null,
      };

      const url = '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingItem(null);
      await fetchData();
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const res = await fetch(`/api/inventory?id=${itemToDelete.inventory_id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'ลบข้อมูลไม่สำเร็จ');
      }

      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      await fetchData();
    } catch (error: any) {
      alert(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const selectedProduct = products.find(p => String(p.id) === formData.product_id);
  const selectedProductVariants = selectedProduct?.variants || [];

  // Calculate summary stats
  const totalItems = inventoryItems.length;
  const totalStock = inventoryItems.reduce((sum, item) => sum + item.stock_quantity, 0);
  const lowStockItems = inventoryItems.filter(item => item.available_quantity <= 10).length;
  const outOfStockItems = inventoryItems.filter(item => item.available_quantity === 0).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-gray-900">จัดการสต็อกสินค้า</h1>
          <p className="text-sm text-gray-600 mt-0.5">จัดการจำนวนสต็อกสินค้าตามคลังสินค้า</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Search Input */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="ค้นหาสินค้า, SKU หรือคลังสินค้า"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 w-64 text-xs"
            />
          </div>
          {/* Warehouse Filter */}
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="h-8 min-w-[200px] w-auto border-gray-300 whitespace-nowrap text-xs">
              <SelectValue placeholder="ทุกคลังสินค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคลังสินค้า</SelectItem>
              {warehouses.map(w => (
                <SelectItem key={w.warehouseid} value={String(w.warehouseid)}>
                  {w.warehousename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Stock Status Filter */}
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="h-8 min-w-[160px] w-auto border-gray-300 whitespace-nowrap text-xs">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="low">สต็อกต่ำ (≤10)</SelectItem>
              <SelectItem value="out">สต็อกหมด</SelectItem>
            </SelectContent>
          </Select>
          {/* Add Stock Button */}
          <Button 
            onClick={openAddModal}
            className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มสต็อก</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                  <p className="text-sm text-gray-600 mt-1">รายการสต็อกทั้งหมด</p>
                </div>
                <Package className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{totalStock.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">จำนวนสินค้าทั้งหมด</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
                  <p className="text-sm text-gray-600 mt-1">สต็อกต่ำ (≤10)</p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
                  <p className="text-sm text-gray-600 mt-1">สต็อกหมด</p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการสต็อกสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลสต็อกสินค้า</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-700">สินค้า</th>
                      <th className="text-left p-3 font-semibold text-gray-700">SKU</th>
                      <th className="text-left p-3 font-semibold text-gray-700">คลังสินค้า</th>
                      <th className="text-center p-3 font-semibold text-gray-700">สต็อกทั้งหมด</th>
                      <th className="text-center p-3 font-semibold text-gray-700">จองไว้</th>
                      <th className="text-center p-3 font-semibold text-gray-700">ใช้ได้</th>
                      <th className="text-left p-3 font-semibold text-gray-700">วันหมดอายุ</th>
                      <th className="text-center p-3 font-semibold text-gray-700">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isLowStock = item.available_quantity <= 10;
                      const isOutOfStock = item.available_quantity === 0;
                      
                      return (
                        <tr key={item.inventory_id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.product_name_th}</div>
                              {item.variant_name && (
                                <div className="text-sm text-gray-500">{item.variant_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-sm">{item.sku || '-'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <WarehouseIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{item.warehouse_name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium">{item.stock_quantity.toLocaleString()}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-gray-600">{item.reserved_quantity.toLocaleString()}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-semibold ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {item.available_quantity.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3">
                            {item.expired_date ? (
                              <span className="text-sm">{new Date(item.expired_date).toLocaleDateString('th-TH')}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteModal(item)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'แก้ไขสต็อกสินค้า' : 'เพิ่มสต็อกสินค้า'}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="warehouse_id">คลังสินค้า</Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกคลังสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.warehouseid} value={String(w.warehouseid)}>
                    {w.warehousename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product_id">สินค้า</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  product_id: value,
                  variant_id: '' // Reset variant when product changes
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.product_name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && selectedProductVariants.length > 0 && (
            <div>
              <Label htmlFor="variant_id">ตัวเลือกสินค้า (ไม่บังคับ)</Label>
              <Select
                value={formData.variant_id}
                onValueChange={(value) => setFormData({ ...formData, variant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตัวเลือกสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ไม่มีตัวเลือก</SelectItem>
                  {selectedProductVariants.map(v => (
                    <SelectItem key={v.variant_id} value={String(v.variant_id)}>
                      {v.variant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="stock_quantity">จำนวนสต็อก</Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="reserved_quantity">จำนวนที่จองไว้</Label>
            <Input
              id="reserved_quantity"
              type="number"
              min="0"
              value={formData.reserved_quantity}
              onChange={(e) => setFormData({ ...formData, reserved_quantity: e.target.value })}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="expired_date">วันหมดอายุ (ไม่บังคับ)</Label>
            <Input
              id="expired_date"
              type="date"
              value={formData.expired_date}
              onChange={(e) => setFormData({ ...formData, expired_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>
              บันทึก
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="ยืนยันการลบ"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            คุณแน่ใจหรือไม่ที่จะลบสต็อกสินค้า <strong>{itemToDelete?.product_name_th}</strong> 
            {itemToDelete?.variant_name && ` (${itemToDelete.variant_name})`} 
            จากคลังสินค้า <strong>{itemToDelete?.warehouse_name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              ลบ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

