'use client'

import { useState, useEffect } from 'react';
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
  Upload, 
  Eye, 
  Pencil, 
  Trash2,
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
  Filter,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';

// Data types from API
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

type Product = {
  id: number;
  sub_categories_name: string | null;
  product_name_th: string;
  product_name_en: string;
  base_sku: string | null;
  variants: Array<{
    variant_id: number;
    variant_name: string;
    sku: string | null;
    price: number;
  }>;
};

type Warehouse = {
  warehouseid: number;
  warehousename: string;
  locationaddress: string;
};

type Category = {
  category_id: number;
  category_name_th: string;
  category_name_en: string;
};

type SubCategory = {
  sub_category_id: number;
  sub_category_name_th: string;
  sub_category_name_en: string;
  category_id: number;
};

type InventoryFormData = {
  category_id: number | null;
  sub_category_id: number | null;
  product_id: number | null;
  variant_id: number | null;
  warehouse_id: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  expired_date: string;
};

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal and form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductVariants, setSelectedProductVariants] = useState<Product['variants']>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryFormData>({
    category_id: null,
    sub_category_id: null,
    product_id: null,
    variant_id: null,
    warehouse_id: null,
    stock_quantity: 0,
    reserved_quantity: 0,
    expired_date: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InventoryFormData, string>>>({});
  
  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch categories and warehouses when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      fetchCategories();
      fetchWarehouses();
    }
  }, [isAddModalOpen]);

  // Fetch subcategories when category is selected
  useEffect(() => {
    if (formData.category_id && isAddModalOpen) {
      fetchSubCategories(formData.category_id);
    } else {
      setSubCategories([]);
      setFormData(prev => ({ ...prev, sub_category_id: null, product_id: null, variant_id: null }));
      setProducts([]);
      setSelectedProductVariants([]);
    }
  }, [formData.category_id, isAddModalOpen]);

  // Fetch products when subcategory is selected
  useEffect(() => {
    if (formData.sub_category_id && isAddModalOpen) {
      fetchProducts(formData.category_id);
    } else {
      setProducts([]);
      setFormData(prev => ({ ...prev, product_id: null, variant_id: null }));
      setSelectedProductVariants([]);
    }
  }, [formData.sub_category_id, formData.category_id, isAddModalOpen]);

  // Fetch variants when product is selected
  useEffect(() => {
    if (formData.product_id && isAddModalOpen) {
      fetchVariants(formData.product_id);
    } else {
      setSelectedProductVariants([]);
      setFormData(prev => ({ ...prev, variant_id: null }));
    }
  }, [formData.product_id, isAddModalOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory?limit=1000');
      const data = await res.json();
      
      if (data.ok) {
        console.log('Inventory data received:', data.items?.length || 0, 'items');
        setInventoryItems(data.items || []);
      } else {
        console.error('Error fetching inventory:', data.error);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async (categoryId: number) => {
    try {
      setLoadingSubCategories(true);
      const res = await fetch(`/api/sub_categories?category_id=${categoryId}`);
      const data = await res.json();
      if (data.success) {
        setSubCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const fetchProducts = async (categoryId: number | null) => {
    try {
      setLoadingProducts(true);
      const url = categoryId 
        ? `/api/products?category_id=${categoryId}&limit=1000`
        : '/api/products?limit=1000';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        // Filter by subcategory if selected
        let filteredProducts = data.items || [];
        if (formData.sub_category_id) {
          const selectedSubCategory = subCategories.find(sc => sc.sub_category_id === formData.sub_category_id);
          if (selectedSubCategory) {
            filteredProducts = filteredProducts.filter((p: Product) => {
              // Match by subcategory name (Thai name)
              return p.sub_categories_name === selectedSubCategory.sub_category_name_th;
            });
          }
        }
        setProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVariants = async (productId: number) => {
    try {
      setLoadingVariants(true);
      const res = await fetch(`/api/product-variants?product_id=${productId}&limit=100`);
      const data = await res.json();
      if (data.ok) {
        setSelectedProductVariants(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setSelectedProductVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.ok) {
        setWarehouses(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const handleOpenModal = () => {
    setIsAddModalOpen(true);
    setCurrentStep(1);
    setFormData({
      category_id: null,
      sub_category_id: null,
      product_id: null,
      variant_id: null,
      warehouse_id: null,
      stock_quantity: 0,
      reserved_quantity: 0,
      expired_date: '',
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setCurrentStep(1);
    setFormData({
      category_id: null,
      sub_category_id: null,
      product_id: null,
      variant_id: null,
      warehouse_id: null,
      stock_quantity: 0,
      reserved_quantity: 0,
      expired_date: '',
    });
    setFormErrors({});
    setSelectedProductVariants([]);
    setSubCategories([]);
    setProducts([]);
  };

  const validateStep = (step: number): boolean => {
    const errors: Partial<Record<keyof InventoryFormData, string>> = {};
    
    if (step === 1) {
      if (!formData.category_id) {
        errors.category_id = 'กรุณาเลือกประเภทสินค้า';
      } else if (!formData.sub_category_id) {
        errors.sub_category_id = 'กรุณาเลือกหมวดย่อย';
      } else if (!formData.product_id) {
        errors.product_id = 'กรุณาเลือกสินค้า';
      }
    } else if (step === 2) {
      if (!formData.warehouse_id) {
        errors.warehouse_id = 'กรุณาเลือกคลังสินค้า';
      }
    } else if (step === 3) {
      if (!formData.stock_quantity || formData.stock_quantity <= 0) {
        errors.stock_quantity = 'กรุณากรอกจำนวนสินค้าที่ถูกต้อง (มากกว่า 0)';
      }
      if (formData.reserved_quantity < 0) {
        errors.reserved_quantity = 'จำนวนสินค้าที่จองต้องไม่น้อยกว่า 0';
      }
      if (formData.reserved_quantity > formData.stock_quantity) {
        errors.reserved_quantity = 'จำนวนสินค้าที่จองต้องไม่เกินจำนวนสินค้าทั้งหมด';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(3, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setSubmitting(true);
      const payload = {
        product_id: formData.product_id,
        variant_id: formData.variant_id || null,
        warehouse_id: formData.warehouse_id,
        stock_quantity: formData.stock_quantity,
        reserved_quantity: formData.reserved_quantity,
        expired_date: formData.expired_date || null,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        // Refresh inventory data
        await fetchData();
        handleCloseModal();
        alert('เพิ่มสินค้าในสต็อกสำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error submitting inventory:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้าในสต็อก');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const selectedWarehouse = warehouses.find(w => w.warehouseid === formData.warehouse_id);

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/inventory?id=${itemToDelete.inventory_id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.ok) {
        // Refresh inventory data
        await fetchData();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        alert('ลบสินค้าในสต็อกสำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('เกิดข้อผิดพลาดในการลบสินค้าในสต็อก');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Calculate metrics
  const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.price || 0) * item.available_quantity), 0);
  const totalProducts = inventoryItems.length;
  const productsInStock = inventoryItems.filter(item => item.available_quantity > 0).reduce((sum, item) => sum + item.available_quantity, 0);
  const outOfStockCount = inventoryItems.filter(item => item.available_quantity === 0).length;
  const lowStockCount = inventoryItems.filter(item => item.available_quantity > 0 && item.available_quantity <= 10).length;

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.product_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.variant_sku && item.variant_sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || (item.sub_category_name && item.sub_category_name === selectedCategory);
    let matchesStatus = true;
    if (selectedStatus === 'in_stock') {
      matchesStatus = item.available_quantity > 10;
    } else if (selectedStatus === 'low_stock') {
      matchesStatus = item.available_quantity > 0 && item.available_quantity <= 10;
    } else if (selectedStatus === 'out_of_stock') {
      matchesStatus = item.available_quantity === 0;
    }
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Get unique categories for filtering
  const filterCategories = Array.from(new Set(inventoryItems.map(item => item.sub_category_name).filter(Boolean) as string[]));

  const getStatusBadge = (availableQuantity: number) => {
    if (availableQuantity === 0) {
      return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-red-100 text-red-800">ขาดสต็อก</span>;
    } else if (availableQuantity <= 10) {
      return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-orange-100 text-orange-800">สต็อกต่ำ</span>;
    } else {
      return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800">มีสินค้า</span>;
    }
  };

  const getActiveStatusBadge = (isActive: boolean | null) => {
    if (isActive === true) {
      return <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-green-100 text-green-800">เปิดการขาย</span>;
    } else {
      return <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium bg-gray-100 text-gray-800">ไม่พร้อมใช้งาน</span>;
    }
  };

  const getQuantityColor = (quantity: number, availableQuantity: number) => {
    if (availableQuantity === 0) return 'text-red-600 font-semibold';
    if (availableQuantity <= 10) return 'text-orange-600 font-semibold';
    return 'text-gray-900';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการสต็อกสินค้า</h1>
              <p className="text-xs text-gray-600 mt-1">จัดการจำนวนสินค้าและรายการจัดจำหน่าย</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">อัปเดตเมื่อ {new Date().toLocaleDateString('th-TH')}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 flex items-center gap-1.5 text-xs px-2">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ส่งออกข้อมูล</span>
              </Button>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white h-8 flex items-center gap-1.5 text-xs px-2"
                onClick={handleOpenModal}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เพิ่มสินค้าในสต็อก</span>
                <span className="sm:hidden">เพิ่ม</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Value Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">มูลค่ารวมทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">฿{formatCurrency(totalValue)}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">+6.2% จากเดือนที่แล้ว</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รายการสินค้าทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">+5% จากเดือนที่แล้ว</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products in Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าในสต็อก</p>
                  <p className="text-lg font-bold text-gray-900">{productsInStock}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">+10% จากเดือนที่แล้ว</p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Card */}
          <Card>
                      <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าหมด</p>
                  <p className="text-lg font-bold text-gray-900">{outOfStockCount}</p>
                  <p className="text-[0.65rem] text-red-600 mt-1">ต้องเติมสต็อกสินค้าด่วน</p>
                          </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

          {/* Low Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าใกล้หมด</p>
                  <p className="text-lg font-bold text-gray-900">{lowStockCount}</p>
                  <p className="text-[0.65rem] text-orange-600 mt-1">ต้องเติมสต็อกสินค้า</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        {/* Inventory Table Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">รายการสินค้าในสต็อก</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาสินค้า"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
            />
          </div>
              <Select value={selectedCategory} onValueChange={(value: string) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {filterCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value: string) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="in_stock">มีสินค้า</SelectItem>
                  <SelectItem value="low_stock">สต็อกต่ำ</SelectItem>
                  <SelectItem value="out_of_stock">ขาดสต็อก</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 px-3 whitespace-nowrap">
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">ตัวกรอง</span>
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลสินค้า</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-[200px] text-xs">สินค้า</TH>
                      <TH className="w-[120px] text-xs">SKU</TH>
                      <TH className="w-[150px] text-xs">หมวดหมู่</TH>
                      <TH className="w-[120px] text-xs">คุณสมบัติ</TH>
                      <TH className="w-[120px] text-xs">จำนวนคงเหลือ</TH>
                      <TH className="w-[120px] text-xs">ราคา</TH>
                      <TH className="w-[120px] text-xs">สถานะ</TH>
                      <TH className="w-[120px] text-xs">สถานะการใช้งาน</TH>
                      <TH className="w-[180px] text-xs">วันที่นำเข้าคลัง</TH>
                      <TH className="w-[200px] text-xs">การดำเนินการ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {paginatedItems.map((item) => (
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
                          <div className={`text-xs ${getQuantityColor(item.stock_quantity, item.available_quantity)}`}>
                            {item.available_quantity}
                          </div>
                        </TD>
                        <TD>
                          <div className="text-xs font-medium">
                            {item.price ? `฿${formatCurrency(item.price)}` : 'N/A'}
                          </div>
                        </TD>
                        <TD>
                          {getStatusBadge(item.available_quantity)}
                        </TD>
                        <TD>
                          {getActiveStatusBadge(item.is_active)}
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{formatDate(item.created_date)}</div>
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-[0.7rem] px-2">
                              <Eye className="w-3 h-3 mr-1" />
                              ดูรายละเอียด
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(item)}
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
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-xs text-gray-600">
                  แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredItems.length)} จาก {filteredItems.length} รายการ
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
                        className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
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

      {/* Add Inventory Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="เพิ่มสินค้าในสต็อก"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                        currentStep === step
                          ? 'bg-pink-500 text-white'
                          : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step ? '✓' : step}
                    </div>
                    <div className="mt-2 text-xs text-center whitespace-nowrap">
                      {step === 1 && 'เลือกสินค้า'}
                      {step === 2 && 'เลือกคลังสินค้า'}
                      {step === 3 && 'กรอกข้อมูลสต็อก'}
                    </div>
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-0.5 w-16 mx-2 ${
                        currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Select Product */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  เลือกประเภทสินค้า <span className="text-red-500">*</span>
                </Label>
                {loadingCategories ? (
                  <div className="text-sm text-gray-500 mt-2">กำลังโหลดประเภทสินค้า...</div>
                ) : (
                  <Select
                    value={formData.category_id?.toString() || ''}
                    onValueChange={(value: string) => {
                      setFormData(prev => ({
                        ...prev,
                        category_id: value ? Number(value) : null,
                        sub_category_id: null,
                        product_id: null,
                        variant_id: null,
                      }));
                      setFormErrors(prev => ({ ...prev, category_id: undefined, sub_category_id: undefined, product_id: undefined }));
                    }}
                  >
                    <SelectTrigger id="category" className="mt-1">
                      <SelectValue placeholder="เลือกประเภทสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                          {category.category_name_th} {category.category_name_en && `(${category.category_name_en})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.category_id && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.category_id}</p>
                )}
              </div>

              {/* Subcategory Selection */}
              {formData.category_id && (
                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium">
                    เลือกหมวดย่อย <span className="text-red-500">*</span>
                  </Label>
                  {loadingSubCategories ? (
                    <div className="text-sm text-gray-500 mt-2">กำลังโหลดหมวดย่อย...</div>
                  ) : (
                    <Select
                      value={formData.sub_category_id?.toString() || ''}
                      onValueChange={(value: string) => {
                        setFormData(prev => ({
                          ...prev,
                          sub_category_id: value ? Number(value) : null,
                          product_id: null,
                          variant_id: null,
                        }));
                        setFormErrors(prev => ({ ...prev, sub_category_id: undefined, product_id: undefined }));
                      }}
                    >
                      <SelectTrigger id="subcategory" className="mt-1">
                        <SelectValue placeholder="เลือกหมวดย่อย" />
                      </SelectTrigger>
                      <SelectContent>
                        {subCategories.map((subCategory) => (
                          <SelectItem key={subCategory.sub_category_id} value={subCategory.sub_category_id.toString()}>
                            {subCategory.sub_category_name_th} {subCategory.sub_category_name_en && `(${subCategory.sub_category_name_en})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formErrors.sub_category_id && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.sub_category_id}</p>
                  )}
                </div>
              )}

              {/* Product Selection */}
              {formData.sub_category_id && (
                <div>
                  <Label htmlFor="product" className="text-sm font-medium">
                    เลือกสินค้า <span className="text-red-500">*</span>
                  </Label>
                  {loadingProducts ? (
                    <div className="text-sm text-gray-500 mt-2">กำลังโหลดสินค้า...</div>
                  ) : products.length === 0 ? (
                    <div className="text-sm text-gray-500 mt-2">ไม่พบสินค้าในหมวดย่อยนี้</div>
                  ) : (
                    <Select
                      value={formData.product_id?.toString() || ''}
                      onValueChange={(value: string) => {
                        setFormData(prev => ({
                          ...prev,
                          product_id: value ? Number(value) : null,
                          variant_id: null,
                        }));
                        setFormErrors(prev => ({ ...prev, product_id: undefined }));
                      }}
                    >
                      <SelectTrigger id="product" className="mt-1">
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.product_name_th} {product.product_name_en && `(${product.product_name_en})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formErrors.product_id && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.product_id}</p>
                  )}
                </div>
              )}

              {selectedProduct && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">ข้อมูลสินค้า</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium">ชื่อสินค้า:</span> {selectedProduct.product_name_th}</p>
                    {selectedProduct.product_name_en && (
                      <p><span className="font-medium">ชื่อภาษาอังกฤษ:</span> {selectedProduct.product_name_en}</p>
                    )}
                    {selectedProduct.base_sku && (
                      <p><span className="font-medium">SKU:</span> {selectedProduct.base_sku}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Variant Selection */}
              {selectedProduct && (
                <div>
                  <Label htmlFor="variant" className="text-sm font-medium">
                    เลือกรูปแบบสินค้า (ถ้ามี)
                  </Label>
                  {loadingVariants ? (
                    <div className="text-sm text-gray-500 mt-2">กำลังโหลดรูปแบบสินค้า...</div>
                  ) : selectedProductVariants.length > 0 ? (
                    <>
                      <Select
                        value={formData.variant_id?.toString() || ''}
                        onValueChange={(value: string) => {
                          setFormData(prev => ({
                            ...prev,
                            variant_id: value === 'none' || !value ? null : Number(value),
                          }));
                        }}
                      >
                        <SelectTrigger id="variant" className="mt-1">
                          <SelectValue placeholder="เลือกรูปแบบสินค้า (ไม่บังคับ)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ไม่เลือกรูปแบบ</SelectItem>
                          {selectedProductVariants.map((variant) => (
                            <SelectItem key={variant.variant_id} value={variant.variant_id.toString()}>
                              {variant.variant_name} {variant.sku && `(${variant.sku})`} - ฿{variant.price.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">หากสินค้ามีรูปแบบ ให้เลือกรูปแบบที่ต้องการ หากไม่มีสามารถข้ามขั้นตอนนี้ได้</p>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">สินค้านี้ไม่มีรูปแบบ</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Warehouse */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="warehouse" className="text-sm font-medium">
                  เลือกคลังสินค้า <span className="text-red-500">*</span>
                </Label>
                {loadingWarehouses ? (
                  <div className="text-sm text-gray-500 mt-2">กำลังโหลดคลังสินค้า...</div>
                ) : (
                  <Select
                    value={formData.warehouse_id?.toString() || ''}
                    onValueChange={(value: string) => {
                      setFormData(prev => ({
                        ...prev,
                        warehouse_id: value ? Number(value) : null,
                      }));
                      setFormErrors(prev => ({ ...prev, warehouse_id: undefined }));
                    }}
                  >
                    <SelectTrigger id="warehouse" className="mt-1">
                      <SelectValue placeholder="เลือกคลังสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.warehouseid} value={warehouse.warehouseid.toString()}>
                          {warehouse.warehousename} - {warehouse.locationaddress}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.warehouse_id && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.warehouse_id}</p>
                )}
              </div>

              {selectedWarehouse && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">ข้อมูลคลังสินค้า</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium">ชื่อคลัง:</span> {selectedWarehouse.warehousename}</p>
                    <p><span className="font-medium">ที่อยู่:</span> {selectedWarehouse.locationaddress}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Stock Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock_quantity" className="text-sm font-medium">
                  จำนวนสินค้า <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="1"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      stock_quantity: value,
                    }));
                    setFormErrors(prev => ({ ...prev, stock_quantity: undefined }));
                  }}
                  className="mt-1"
                  placeholder="กรอกจำนวนสินค้า"
                />
                {formErrors.stock_quantity && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.stock_quantity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reserved_quantity" className="text-sm font-medium">
                  จำนวนสินค้าที่จอง (ถ้ามี)
                </Label>
                <Input
                  id="reserved_quantity"
                  type="number"
                  min="0"
                  value={formData.reserved_quantity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      reserved_quantity: value,
                    }));
                    setFormErrors(prev => ({ ...prev, reserved_quantity: undefined }));
                  }}
                  className="mt-1"
                  placeholder="จำนวนสินค้าที่จองไว้"
                />
                {formErrors.reserved_quantity && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.reserved_quantity}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  จำนวนสินค้าที่พร้อมขาย = จำนวนสินค้า - จำนวนสินค้าที่จอง = {Math.max(0, (formData.stock_quantity || 0) - (formData.reserved_quantity || 0))}
                </p>
              </div>

              <div>
                <Label htmlFor="expired_date" className="text-sm font-medium">
                  วันที่หมดอายุ (ถ้ามี)
                </Label>
                <Input
                  id="expired_date"
                  type="date"
                  value={formData.expired_date}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      expired_date: e.target.value,
                    }));
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">หากสินค้าไม่มีวันหมดอายุ สามารถข้ามได้</p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">สรุปข้อมูล</p>
                <div className="space-y-1 text-xs text-blue-800">
                  {formData.category_id && (
                    <p>
                      <span className="font-medium">ประเภท:</span>{' '}
                      {categories.find(c => c.category_id === formData.category_id)?.category_name_th || 'N/A'}
                    </p>
                  )}
                  {formData.sub_category_id && (
                    <p>
                      <span className="font-medium">หมวดย่อย:</span>{' '}
                      {subCategories.find(sc => sc.sub_category_id === formData.sub_category_id)?.sub_category_name_th || 'N/A'}
                    </p>
                  )}
                  <p><span className="font-medium">สินค้า:</span> {selectedProduct?.product_name_th || 'N/A'}</p>
                  {formData.variant_id && (
                    <p>
                      <span className="font-medium">รูปแบบ:</span>{' '}
                      {selectedProductVariants.find(v => v.variant_id === formData.variant_id)?.variant_name || 'N/A'}
                    </p>
                  )}
                  <p><span className="font-medium">คลังสินค้า:</span> {selectedWarehouse?.warehousename || 'N/A'}</p>
                  <p><span className="font-medium">จำนวนสินค้า:</span> {formData.stock_quantity || 0}</p>
                  <p><span className="font-medium">จำนวนที่จอง:</span> {formData.reserved_quantity || 0}</p>
                  <p><span className="font-medium">จำนวนที่พร้อมขาย:</span> {Math.max(0, (formData.stock_quantity || 0) - (formData.reserved_quantity || 0))}</p>
                  {formData.expired_date && (
                    <p><span className="font-medium">วันหมดอายุ:</span> {new Date(formData.expired_date).toLocaleDateString('th-TH')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleCloseModal : handleBack}
              disabled={submitting}
            >
              {currentStep === 1 ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  ยกเลิก
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  ย้อนกลับ
                </>
              )}
            </Button>
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="ยืนยันการลบ"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-2">
                  คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?
                </p>
                <p className="text-xs text-red-700">
                  การกระทำนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          </div>

          {itemToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">รายละเอียดรายการที่จะลบ</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">สินค้า:</span> {itemToDelete.product_name_th}</p>
                {itemToDelete.variant_sku && (
                  <p><span className="font-medium">SKU:</span> {itemToDelete.variant_sku}</p>
                )}
                {itemToDelete.attribute_value_th && (
                  <p><span className="font-medium">คุณสมบัติ:</span> {itemToDelete.attribute_value_th}</p>
                )}
                <p><span className="font-medium">คลังสินค้า:</span> {itemToDelete.warehouse_name}</p>
                <p><span className="font-medium">จำนวนคงเหลือ:</span> {itemToDelete.available_quantity}</p>
                {itemToDelete.price && (
                  <p><span className="font-medium">ราคา:</span> ฿{formatCurrency(itemToDelete.price)}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
