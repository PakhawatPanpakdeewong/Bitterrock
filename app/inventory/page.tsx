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
  Filter
} from 'lucide-react';

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

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

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

  // Get unique categories
  const categories = Array.from(new Set(inventoryItems.map(item => item.sub_category_name).filter(Boolean) as string[]));

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
                  {categories.map((cat) => (
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
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
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
    </div>
  );
}
