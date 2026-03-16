'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Pencil, 
  Trash2,
  Warehouse as WarehouseIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/components/ui/notification';
import { Textarea } from '@/components/ui/input';

type Warehouse = {
  warehouseid: number;
  warehousename: string;
  locationaddress: string;
  contactperson: string | null;
  email: string | null;
};

type WarehouseFormData = {
  warehouse_name: string;
  location_address: string;
  contact_person: string;
  email: string;
};

type InventoryItem = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  created_date: string | null;
  product_name_th: string;
  product_name_en: string;
  sub_category_name: string | null;
  variant_sku: string | null;
  price: number | null;
  is_active: boolean | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  warehouse_name: string;
};

export default function WarehouseStockPage() {
  const { notify } = useNotification();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [checkingInventory, setCheckingInventory] = useState(false);
  const [warehouseInventoryItems, setWarehouseInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventoryItems, setLoadingInventoryItems] = useState(false);
  
  const [formData, setFormData] = useState<WarehouseFormData>({
    warehouse_name: '',
    location_address: '',
    contact_person: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof WarehouseFormData, string>>>({});

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.ok) {
        setWarehouses(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      warehouse_name: '',
      location_address: '',
      contact_person: '',
      email: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({
      warehouse_name: '',
      location_address: '',
      contact_person: '',
      email: '',
    });
    setFormErrors({});
  };

  const handleOpenEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      warehouse_name: warehouse.warehousename,
      location_address: warehouse.locationaddress,
      contact_person: warehouse.contactperson || '',
      email: warehouse.email || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedWarehouse(null);
    setFormData({
      warehouse_name: '',
      location_address: '',
      contact_person: '',
      email: '',
    });
    setFormErrors({});
  };

  const checkInventoryCount = async (warehouseId: number): Promise<number> => {
    try {
      // Use inventory API to check if there are any items
      // We'll fetch with limit=1000 to get all items for this warehouse
      const res = await fetch(`/api/inventory?warehouse_id=${warehouseId}&limit=1000`);
      const data = await res.json();
      if (data.ok && data.items) {
        return data.items.length;
      }
      return 0;
    } catch (error) {
      console.error('Error checking inventory:', error);
      return 0;
    }
  };

  const handleOpenDeleteModal = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setCheckingInventory(true);
    setInventoryCount(null);
    
    try {
      const count = await checkInventoryCount(warehouse.warehouseid);
      setInventoryCount(count);
      
      if (count > 0) {
        // Still open modal but show warning message
        setIsDeleteModalOpen(true);
      } else {
        // No inventory, safe to delete
        setIsDeleteModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      // Open modal anyway but show error
      setIsDeleteModalOpen(true);
    } finally {
      setCheckingInventory(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedWarehouse(null);
    setInventoryCount(null);
  };

  const fetchWarehouseInventory = async (warehouseId: number) => {
    try {
      setLoadingInventoryItems(true);
      const res = await fetch(`/api/inventory?warehouse_id=${warehouseId}&limit=1000`);
      const data = await res.json();
      if (data.ok) {
        setWarehouseInventoryItems(data.items || []);
      } else {
        setWarehouseInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      setWarehouseInventoryItems([]);
    } finally {
      setLoadingInventoryItems(false);
    }
  };

  const handleViewDetail = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDetailModalOpen(true);
    fetchWarehouseInventory(warehouse.warehouseid);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedWarehouse(null);
    setWarehouseInventoryItems([]);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof WarehouseFormData, string>> = {};
    
    if (!formData.warehouse_name.trim()) {
      errors.warehouse_name = 'กรุณากรอกชื่อคลังสินค้า';
    }
    
    if (!formData.location_address.trim()) {
      errors.location_address = 'กรุณากรอกที่อยู่';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditModalOpen 
        ? '/api/warehouses' 
        : '/api/warehouses';
      
      const method = isEditModalOpen ? 'PUT' : 'POST';
      
      const body = isEditModalOpen
        ? {
            warehouse_id: selectedWarehouse?.warehouseid,
            warehouse_name: formData.warehouse_name,
            location_address: formData.location_address,
            contact_person: formData.contact_person || null,
            email: formData.email || null,
          }
        : {
            warehouse_name: formData.warehouse_name,
            location_address: formData.location_address,
            contact_person: formData.contact_person || null,
            email: formData.email || null,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchWarehouses();
        if (isEditModalOpen) {
          handleCloseEditModal();
        } else {
          handleCloseAddModal();
        }
      } else {
        notify(data.error || 'เกิดข้อผิดพลาด', { type: 'error' });
      }
    } catch (error) {
      console.error('Error saving warehouse:', error);
      notify('เกิดข้อผิดพลาดในการบันทึกข้อมูล', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;

    // Double check inventory count before deleting
    if (inventoryCount !== null && inventoryCount > 0) {
      notify(
        `ไม่สามารถลบคลังสินค้าได้ เนื่องจากมีสินค้า ${inventoryCount} รายการในคลังสินค้านี้ กรุณาลบหรือย้ายสินค้าออกก่อน`,
        { type: 'warning' }
      );
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/warehouses?id=${selectedWarehouse.warehouseid}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.ok) {
        await fetchWarehouses();
        handleCloseDeleteModal();
      } else {
        // Check if it's a conflict error (has inventory)
        if (res.status === 409) {
          notify(
            data.error || data.details || 'ไม่สามารถลบคลังสินค้าได้ เนื่องจากมีสินค้าอยู่ในคลังสินค้านี้',
            { type: 'warning' }
          );
        } else {
          notify(data.error || 'เกิดข้อผิดพลาด', { type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      notify('เกิดข้อผิดพลาดในการลบข้อมูล', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = 
      warehouse.warehousename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.locationaddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warehouse.contactperson && warehouse.contactperson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (warehouse.email && warehouse.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWarehouses = filteredWarehouses.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการที่จัดเก็บสินค้า (คลังสินค้า)</h1>
              <p className="text-xs text-gray-600 mt-1">จัดการคลังสินค้าและข้อมูลการจัดเก็บ</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">อัปเดตเมื่อ {new Date().toLocaleDateString('th-TH')}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={fetchWarehouses}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
                onClick={handleOpenAddModal}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เพิ่มคลังสินค้า</span>
                <span className="sm:hidden">เพิ่ม</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">จำนวนคลังสินค้า</p>
                  <p className="text-lg font-bold text-gray-900">{warehouses.length}</p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Table Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">รายการคลังสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาคลังสินค้า"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500 text-xs">กำลังโหลด...</div>
            ) : filteredWarehouses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">ไม่พบข้อมูลคลังสินค้า</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-[200px] text-xs">ชื่อคลังสินค้า</TH>
                      <TH className="w-[300px] text-xs">ที่อยู่</TH>
                      <TH className="w-[150px] text-xs">รายชื่อติดต่อ</TH>
                      <TH className="w-[200px] text-xs">อีเมลล์</TH>
                      <TH className="w-[200px] text-xs">การดำเนินการ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {paginatedWarehouses.map((warehouse) => (
                      <TR key={warehouse.warehouseid}>
                        <TD>
                          <div className="font-medium text-xs">{warehouse.warehousename}</div>
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{warehouse.locationaddress}</div>
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{warehouse.contactperson || 'N/A'}</div>
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{warehouse.email || 'N/A'}</div>
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[0.7rem] px-2"
                              onClick={() => handleViewDetail(warehouse)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              ดูรายละเอียด
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenEditModal(warehouse)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenDeleteModal(warehouse)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {filteredWarehouses.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-xs text-gray-600">
                  แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredWarehouses.length)} จาก {filteredWarehouses.length} รายการ
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    &lt;&lt;
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: Math.min(16, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 16) {
                      pageNum = i + 1;
                    } else if (currentPage <= 8) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 7) {
                      pageNum = totalPages - 15 + i;
                    } else {
                      pageNum = currentPage - 7 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 text-xs ${currentPage === pageNum ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    &gt;
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    &gt;&gt;
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="เพิ่มคลังสินค้า"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="warehouse_name" className="text-xs font-medium">
                ชื่อคลังสินค้า <span className="text-red-500">*</span>
              </Label>
              <Input
                id="warehouse_name"
                value={formData.warehouse_name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, warehouse_name: e.target.value }));
                  setFormErrors(prev => ({ ...prev, warehouse_name: undefined }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกชื่อคลังสินค้า"
              />
              {formErrors.warehouse_name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.warehouse_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location_address" className="text-xs font-medium">
                ที่อยู่ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="location_address"
                value={formData.location_address}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, location_address: e.target.value }));
                  setFormErrors(prev => ({ ...prev, location_address: undefined }));
                }}
                className="mt-1 text-xs"
                placeholder="กรอกที่อยู่คลังสินค้า"
                rows={3}
              />
              {formErrors.location_address && (
                <p className="text-xs text-red-500 mt-1">{formErrors.location_address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_person" className="text-xs font-medium">
                รายชื่อติดต่อ
              </Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, contact_person: e.target.value }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกรายชื่อติดต่อ"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-medium">
                อีเมลล์
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกอีเมลล์"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddModal}
                className="h-8 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 text-white h-8 text-xs"
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Warehouse Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="แก้ไขคลังสินค้า"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_warehouse_name" className="text-xs font-medium">
                ชื่อคลังสินค้า <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_warehouse_name"
                value={formData.warehouse_name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, warehouse_name: e.target.value }));
                  setFormErrors(prev => ({ ...prev, warehouse_name: undefined }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกชื่อคลังสินค้า"
              />
              {formErrors.warehouse_name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.warehouse_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit_location_address" className="text-xs font-medium">
                ที่อยู่ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit_location_address"
                value={formData.location_address}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, location_address: e.target.value }));
                  setFormErrors(prev => ({ ...prev, location_address: undefined }));
                }}
                className="mt-1 text-xs"
                placeholder="กรอกที่อยู่คลังสินค้า"
                rows={3}
              />
              {formErrors.location_address && (
                <p className="text-xs text-red-500 mt-1">{formErrors.location_address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit_contact_person" className="text-xs font-medium">
                รายชื่อติดต่อ
              </Label>
              <Input
                id="edit_contact_person"
                value={formData.contact_person}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, contact_person: e.target.value }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกรายชื่อติดต่อ"
              />
            </div>

            <div>
              <Label htmlFor="edit_email" className="text-xs font-medium">
                อีเมลล์
              </Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                }}
                className="mt-1 h-9 text-xs"
                placeholder="กรอกอีเมลล์"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
                className="h-8 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 text-white h-8 text-xs"
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="ยืนยันการลบ"
        className="max-w-md"
      >
        <div className="space-y-4">
          {checkingInventory ? (
            <p className="text-xs text-gray-600">กำลังตรวจสอบข้อมูล...</p>
          ) : inventoryCount !== null && inventoryCount > 0 ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-800 mb-2">
                  ไม่สามารถลบคลังสินค้าได้
                </p>
                <p className="text-xs text-red-700">
                  คลังสินค้า <span className="font-semibold">{selectedWarehouse?.warehousename}</span> มีสินค้าอยู่ <span className="font-semibold">{inventoryCount}</span> รายการ
                </p>
                <p className="text-xs text-red-600 mt-2">
                  กรุณาลบหรือย้ายสินค้าออกจากคลังสินค้านี้ก่อนลบคลังสินค้า
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบคลังสินค้า <span className="font-semibold">{selectedWarehouse?.warehousename}</span>?
              </p>
              <p className="text-xs text-red-600">การกระทำนี้ไม่สามารถยกเลิกได้</p>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteModal}
              className="h-8 text-xs"
            >
              {inventoryCount !== null && inventoryCount > 0 ? 'ปิด' : 'ยกเลิก'}
            </Button>
            {(!inventoryCount || inventoryCount === 0) && (
              <Button
                type="button"
                className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs"
                onClick={handleDelete}
                disabled={deleting || checkingInventory}
              >
                {deleting ? 'กำลังลบ...' : 'ลบ'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title="รายละเอียดคลังสินค้า"
        className="max-w-4xl"
      >
        {selectedWarehouse && (
          <div className="space-y-4">
            {/* Warehouse Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">ชื่อคลังสินค้า</Label>
                <p className="text-xs text-gray-900 mt-1">{selectedWarehouse.warehousename}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">เบอร์ติดต่อ</Label>
                <p className="text-xs text-gray-900 mt-1">{selectedWarehouse.contactperson || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-gray-700">ที่อยู่</Label>
                <p className="text-xs text-gray-900 mt-1">{selectedWarehouse.locationaddress}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-medium text-gray-700">อีเมลล์</Label>
                <p className="text-xs text-gray-900 mt-1">{selectedWarehouse.email || 'N/A'}</p>
              </div>
            </div>

            {/* Inventory Items Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold text-gray-700">
                  รายการสินค้าในคลัง ({warehouseInventoryItems.length} รายการ)
                </Label>
                {selectedWarehouse && warehouseInventoryItems.length > 0 && (
                  <Link href={`/inventory?warehouse_id=${selectedWarehouse.warehouseid}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      ไปยังหน้าสต็อกสินค้า
                    </Button>
                  </Link>
                )}
              </div>
              
              {loadingInventoryItems ? (
                <div className="text-center py-4 text-xs text-gray-500">กำลังโหลดข้อมูล...</div>
              ) : warehouseInventoryItems.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500 bg-gray-50 rounded-lg">
                  ไม่มีสินค้าในคลังสินค้านี้
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH className="text-xs sticky top-0 bg-white">สินค้า</TH>
                        <TH className="text-xs sticky top-0 bg-white">SKU</TH>
                        <TH className="text-xs sticky top-0 bg-white">หมวดหมู่</TH>
                        <TH className="text-xs sticky top-0 bg-white">คุณสมบัติ</TH>
                        <TH className="text-xs sticky top-0 bg-white">จำนวนคงเหลือ</TH>
                        <TH className="text-xs sticky top-0 bg-white">ราคา</TH>
                        <TH className="text-xs sticky top-0 bg-white">สถานะ</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {warehouseInventoryItems.map((item) => (
                        <TR key={item.inventory_id}>
                          <TD>
                            <div className="font-medium text-xs">{item.product_name_th || 'N/A'}</div>
                          </TD>
                          <TD>
                            <div className="text-xs text-gray-600">{item.variant_sku || 'N/A'}</div>
                          </TD>
                          <TD>
                            <div className="text-xs text-gray-600">{item.sub_category_name || 'N/A'}</div>
                          </TD>
                          <TD>
                            <div className="text-xs text-gray-600">{item.attribute_value_th || 'N/A'}</div>
                          </TD>
                          <TD>
                            <div className={`text-xs ${
                              item.available_quantity === 0 
                                ? 'text-red-600 font-semibold' 
                                : item.available_quantity < 10 
                                ? 'text-orange-600' 
                                : 'text-gray-900'
                            }`}>
                              {item.available_quantity}
                            </div>
                          </TD>
                          <TD>
                            <div className="text-xs font-medium">
                              {item.price ? `฿${new Intl.NumberFormat('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(item.price)}` : 'N/A'}
                            </div>
                          </TD>
                          <TD>
                            {item.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                เปิดใช้งาน
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ไม่พร้อมใช้งาน
                              </span>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDetailModal}
                className="h-8 text-xs"
              >
                ปิด
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
