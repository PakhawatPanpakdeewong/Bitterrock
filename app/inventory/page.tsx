'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, ChevronDown, Search, Home, Warehouse as WarehouseIcon, Truck } from 'lucide-react';

type Supplier = {
  supplierid: number;
  suppliername: string;
  contactphone: string;
  email: string;
  address: string;
  importedproducts: string;
  status: 'active' | 'paused';
};

type Warehouse = {
  warehouseid: number;
  warehousename: string;
  contactphone: string;
  email: string;
  address: string;
  warehousetype: 'storefront' | 'storage';
  status: 'active' | 'inactive';
};

type SummaryStats = {
  storefrontCount: number;
  warehouseCount: number;
  supplierCount: number;
};

export default function InventoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    storefrontCount: 0,
    warehouseCount: 0,
    supplierCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isStorefrontModalOpen, setIsStorefrontModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'supplier' | 'warehouse' | 'storefront', id: number} | null>(null);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    suppliername: '',
    contactphone: '',
    email: '',
    address: '',
    importedproducts: '',
    status: 'active' as 'active' | 'paused'
  });

  const [warehouseForm, setWarehouseForm] = useState({
    warehousename: '',
    contactphone: '',
    email: '',
    address: '',
    warehousetype: 'storage' as 'storefront' | 'storage',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch suppliers, warehouses, and calculate stats
      // For now, using mock data structure
      const mockSuppliers: Supplier[] = [
        {
          supplierid: 1,
          suppliername: 'บริษัท ABC จำกัด',
          contactphone: '02-123-4567',
          email: 'info@abc.co.th',
          address: '11/22 หมู่บ้านวิภาลัย ถนนพัฒนาชนบท 4 แขวงคลองสองต้นนุ่น เขตลาดกระบัง 10520',
          importedproducts: 'ผลิตภัณฑ์อาบน้ำและดูแลผิว',
          status: 'active'
        },
        {
          supplierid: 2,
          suppliername: 'XYZ Trading',
          contactphone: '02-987-6543',
          email: 'sales@xyz.co.th',
          address: '55/33 ถนนกรุงเทพกรีฑา 39 แขวงสะพานสูง เขตสะพานสูง 10240',
          importedproducts: 'ของเล่น, เสื้อผ้าเด็ก, รถเข็น',
          status: 'active'
        },
        {
          supplierid: 3,
          suppliername: 'Acava Building',
          contactphone: '02-482-9563',
          email: 'acava@email.com',
          address: '55/33 ถนนกรุงเทพกรีฑา 39 แขวงสะพานสูง เขตสะพานสูง 10240',
          importedproducts: 'อาหารเสริมสำหรับเด็ก, อุปกรณ์ชงนม',
          status: 'paused'
        }
      ];

      const mockWarehouses: Warehouse[] = [
        {
          warehouseid: 1,
          warehousename: 'KiddyCare Store',
          contactphone: '096-551-9294',
          email: 'patter@gmail.com',
          address: '178/77 The Plant, ถนนพัฒนาชนบท 3 แขวงคลองสองต้นนุ่น เขตลาดกระบัง 10520',
          warehousetype: 'storefront',
          status: 'active'
        },
        {
          warehouseid: 2,
          warehousename: 'KiddyCare Store',
          contactphone: '096-551-9294',
          email: 'patter@gmail.com',
          address: '178/77 The Plant, ถนนพัฒนาชนบท 3 แขวงคลองสองต้นนุ่น เขตลาดกระบัง 10520',
          warehousetype: 'storage',
          status: 'active'
        }
      ];

      setSuppliers(mockSuppliers);
      setWarehouses(mockWarehouses);
      setSummaryStats({
        storefrontCount: mockWarehouses.filter(w => w.warehousetype === 'storefront').length,
        warehouseCount: mockWarehouses.filter(w => w.warehousetype === 'storage').length,
        supplierCount: mockSuppliers.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.suppliername.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactphone.includes(searchTerm) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const storefronts = warehouses.filter(w => w.warehousetype === 'storefront');
  const storageWarehouses = warehouses.filter(w => w.warehousetype === 'storage');

  const openSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        suppliername: supplier.suppliername,
        contactphone: supplier.contactphone,
        email: supplier.email,
        address: supplier.address,
        importedproducts: supplier.importedproducts,
        status: supplier.status
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        suppliername: '',
        contactphone: '',
        email: '',
        address: '',
        importedproducts: '',
        status: 'active'
      });
    }
    setIsSupplierModalOpen(true);
  };

  const openWarehouseModal = (warehouse?: Warehouse, type?: 'storefront' | 'storage') => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setWarehouseForm({
        warehousename: warehouse.warehousename,
        contactphone: warehouse.contactphone,
        email: warehouse.email,
        address: warehouse.address,
        warehousetype: warehouse.warehousetype,
        status: warehouse.status
      });
      if (warehouse.warehousetype === 'storefront') {
        setIsStorefrontModalOpen(true);
      } else {
        setIsWarehouseModalOpen(true);
      }
    } else {
      setEditingWarehouse(null);
      setWarehouseForm({
        warehousename: '',
        contactphone: '',
        email: '',
        address: '',
        warehousetype: type || 'storage',
        status: 'active'
      });
      if (type === 'storefront') {
        setIsStorefrontModalOpen(true);
      } else {
        setIsWarehouseModalOpen(true);
      }
    }
  };

  const handleSaveSupplier = async () => {
    // Implement save logic
    setIsSupplierModalOpen(false);
    await fetchData();
  };

  const handleSaveWarehouse = async () => {
    // Implement save logic
    setIsWarehouseModalOpen(false);
    setIsStorefrontModalOpen(false);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    // Implement delete logic
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    await fetchData();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">เปิดใช้งาน</span>;
    } else if (status === 'paused') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">พักการสั่งซื้อ</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">ปิดใช้งาน</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการคลังสินค้า</h1>
              <p className="text-sm text-gray-600 mt-1">จัดการสินค้าและซัพพลายเออร์</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="ค้นหารายชื่อคลังสินค้า"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="paused">พักการสั่งซื้อ</SelectItem>
                  <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Summary Cards */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-blue-600">{summaryStats.storefrontCount}</p>
                    <p className="text-sm text-gray-600 mt-2">สถานที่ขายสินค้าหน้าร้าน</p>
                  </div>
                  <Home className="w-12 h-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-pink-600">{summaryStats.warehouseCount}</p>
                    <p className="text-sm text-gray-600 mt-2">จัดเก็บสินค้าไว้เพื่อจำหน่าย</p>
                  </div>
                  <WarehouseIcon className="w-12 h-12 text-pink-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-yellow-600">{summaryStats.supplierCount}</p>
                    <p className="text-sm text-gray-600 mt-2">แหล่งนำเข้า/ผลิตสินค้า</p>
                  </div>
                  <Truck className="w-12 h-12 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Suppliers */}
          <div className="col-span-12 lg:col-span-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">ซัพพลายเออร์</CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-green-100 text-green-600 hover:bg-green-200" onClick={() => openSupplierModal()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-100 text-blue-600 hover:bg-blue-200">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.supplierid} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{supplier.suppliername}</h3>
                          <p className="text-sm text-gray-600 mb-1">เบอร์ติดต่อ : {supplier.contactphone}</p>
                          <p className="text-sm text-gray-600 mb-1">อีเมลล์: {supplier.email}</p>
                          <p className="text-sm text-gray-600 mb-2">ที่อยู่: {supplier.address}</p>
                          <p className="text-sm text-gray-600">
                            สินค้าที่นำเข้า: <span className="font-medium">{supplier.importedproducts}</span>
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(supplier.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredSuppliers.length > 3 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto">
                      ดูเพิ่มเติม <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Storefront & Warehouse */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Storefront Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">หน้าร้านค้า</CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-green-100 text-green-600 hover:bg-green-200" onClick={() => openWarehouseModal(undefined, 'storefront')}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-100 text-blue-600 hover:bg-blue-200">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {storefronts.map((storefront) => (
                  <Card key={storefront.warehouseid} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{storefront.warehousename}</h3>
                          <p className="text-sm text-gray-600 mb-1">เบอร์ติดต่อ : {storefront.contactphone}</p>
                          <p className="text-sm text-gray-600 mb-1">อีเมลล์: {storefront.email}</p>
                          <p className="text-sm text-gray-600">ที่อยู่: {storefront.address}</p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(storefront.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Warehouse Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">คลังจัดเก็บสินค้า</CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-green-100 text-green-600 hover:bg-green-200" onClick={() => openWarehouseModal(undefined, 'storage')}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-blue-100 text-blue-600 hover:bg-blue-200">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {storageWarehouses.map((warehouse) => (
                  <Card key={warehouse.warehouseid} className="border-l-4 border-l-pink-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{warehouse.warehousename}</h3>
                          <p className="text-sm text-gray-600 mb-1">เบอร์ติดต่อ : {warehouse.contactphone}</p>
                          <p className="text-sm text-gray-600 mb-1">อีเมลล์: {warehouse.email}</p>
                          <p className="text-sm text-gray-600">ที่อยู่: {warehouse.address}</p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(warehouse.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์ใหม่'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อซัพพลายเออร์</label>
            <Input
              value={supplierForm.suppliername}
              onChange={(e) => setSupplierForm({ ...supplierForm, suppliername: e.target.value })}
              placeholder="กรุณาใส่ชื่อซัพพลายเออร์"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">เบอร์ติดต่อ</label>
            <Input
              value={supplierForm.contactphone}
              onChange={(e) => setSupplierForm({ ...supplierForm, contactphone: e.target.value })}
              placeholder="02-123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">อีเมลล์</label>
            <Input
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              placeholder="info@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ที่อยู่</label>
            <Textarea
              rows={3}
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="กรุณาใส่ที่อยู่"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สินค้าที่นำเข้า</label>
            <Input
              value={supplierForm.importedproducts}
              onChange={(e) => setSupplierForm({ ...supplierForm, importedproducts: e.target.value })}
              placeholder="ผลิตภัณฑ์อาบน้ำและดูแลผิว"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สถานะ</label>
            <Select value={supplierForm.status} onValueChange={(value: 'active' | 'paused') => setSupplierForm({ ...supplierForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">เปิดใช้งาน</SelectItem>
                <SelectItem value="paused">พักการสั่งซื้อ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSupplierModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveSupplier}>บันทึก</Button>
          </div>
        </div>
      </Modal>

      {/* Warehouse/Storefront Modal */}
      <Modal
        isOpen={isWarehouseModalOpen || isStorefrontModalOpen}
        onClose={() => {
          setIsWarehouseModalOpen(false);
          setIsStorefrontModalOpen(false);
        }}
        title={editingWarehouse ? 'แก้ไขคลังสินค้า' : warehouseForm.warehousetype === 'storefront' ? 'เพิ่มหน้าร้านค้าใหม่' : 'เพิ่มคลังสินค้าใหม่'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อ{warehouseForm.warehousetype === 'storefront' ? 'หน้าร้านค้า' : 'คลังสินค้า'}</label>
            <Input
              value={warehouseForm.warehousename}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, warehousename: e.target.value })}
              placeholder={`กรุณาใส่ชื่อ${warehouseForm.warehousetype === 'storefront' ? 'หน้าร้านค้า' : 'คลังสินค้า'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">เบอร์ติดต่อ</label>
            <Input
              value={warehouseForm.contactphone}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, contactphone: e.target.value })}
              placeholder="096-551-9294"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">อีเมลล์</label>
            <Input
              type="email"
              value={warehouseForm.email}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, email: e.target.value })}
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ที่อยู่</label>
            <Textarea
              rows={3}
              value={warehouseForm.address}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
              placeholder="กรุณาใส่ที่อยู่"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สถานะ</label>
            <Select value={warehouseForm.status} onValueChange={(value: 'active' | 'inactive') => setWarehouseForm({ ...warehouseForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">เปิดใช้งาน</SelectItem>
                <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsWarehouseModalOpen(false);
              setIsStorefrontModalOpen(false);
            }}>ยกเลิก</Button>
            <Button onClick={handleSaveWarehouse}>บันทึก</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบ"
      >
        <div className="space-y-4">
          <p className="text-gray-700">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}