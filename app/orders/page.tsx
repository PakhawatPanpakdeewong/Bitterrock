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
  Search, 
  RefreshCw, 
  Eye, 
  Pencil, 
  Trash2,
  ShoppingCart,
  Clock,
  User,
  CheckCircle,
  Download,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

type Order = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  shipping_address: string;
  notes: string | null;
  created_date: string;
  updated_date: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  item_count: number;
  delivery_status: string;
};

type OrderStats = {
  orders_today: number;
  pending_today: number;
  successful_today: number;
  sales_today: number;
  total_pending: number;
  success_rate: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<OrderStats>({
    orders_today: 0,
    pending_today: 0,
    successful_today: 0,
    sales_today: 0,
    total_pending: 0,
    success_rate: 0
  });
  const itemsPerPage = 8;

  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setOrders(data.items);
        setStats(data.stats);
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleEditClick = (order: Order) => {
    setOrderToEdit(order);
    setEditStatus(order.order_status);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setOrderToEdit(null);
    setEditStatus('');
  };

  const handleEditSubmit = async () => {
    if (!orderToEdit) return;

    try {
      setUpdating(true);
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderToEdit.order_id,
          order_status: editStatus
        }),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchOrders();
        setIsEditModalOpen(false);
        setOrderToEdit(null);
        alert('อัปเดตสถานะออเดอร์สำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตออเดอร์');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/orders?id=${orderToDelete.order_id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.ok) {
        await fetchOrders();
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);
        alert('ลบออเดอร์สำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('เกิดข้อผิดพลาดในการลบออเดอร์');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
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

  const formatOrderNumber = (orderId: number, orderDate: string) => {
    try {
      const date = new Date(orderDate);
      // Use BE year (2568 = 2025 CE, so use last 2 digits: 25)
      const beYear = date.getFullYear() + 543; // Convert to BE
      const year = beYear.toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const orderNum = String(orderId).padStart(3, '0');
      return `#ORD-${year}${month}${day}-${orderNum}`;
    } catch {
      return `#ORD-${orderId}`;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800">สำเร็จ</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-yellow-100 text-yellow-800">รอการชำระเงิน</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-blue-100 text-blue-800">กำลังจัดส่ง</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-red-100 text-red-800">ยกเลิกออเดอร์</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getDeliveryStatusBadge = (deliveryStatus: string) => {
    switch (deliveryStatus) {
      case 'จัดเตรียมสินค้า':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-blue-100 text-blue-800">จัดเตรียมสินค้า</span>;
      case 'กำลังจัดส่ง':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-pink-100 text-pink-800">กำลังจัดส่ง</span>;
      case 'จัดส่งสำเร็จ':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800">จัดส่งสำเร็จ</span>;
      case 'ยังไม่ดำเนินการ':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-gray-100 text-gray-800">ยังไม่ดำเนินการ</span>;
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      formatOrderNumber(order.order_id, order.order_date).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (selectedDate === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderDate = new Date(order.order_date);
      orderDate.setHours(0, 0, 0, 0);
      matchesDate = orderDate.getTime() === today.getTime();
    }

    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Get current date info
  const today = new Date();
  const todayStr = today.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const updateTime = today.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการรายการสั่งซื้อ</h1>
              <p className="text-xs text-gray-600 mt-1">จัดการแก้ไขและเปลี่ยนสถานะออเดอร์</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">อัปเดตเมื่อ {todayStr} {updateTime} น.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full" 
                onClick={handleRefresh}
                title="รีเฟรช"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 flex items-center gap-1.5 text-xs px-2"
                onClick={() => alert('ฟีเจอร์ส่งออกข้อมูลจะเปิดใช้งานเร็วๆ นี้')}
              >
                <Download className="w-3.5 h-3.5" />
                ส่งออกข้อมูล
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Daily Data Card */}
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">ข้อมูลประจำวันที่</p>
                <p className="text-sm font-bold text-gray-900">{todayStr}</p>
                <p className="text-[0.65rem] text-gray-500 mt-1">วันที่ 1 - {today.getDate()} {today.toLocaleDateString('th-TH', { month: 'long' })} {today.getFullYear() + 543}</p>
              </div>
            </CardContent>
          </Card>

          {/* Orders Today Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">คำสั่งซื้อวันนี้</p>
                  <p className="text-lg font-bold text-gray-900">{stats.orders_today}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">+10% จากเมื่อวาน</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รอดำเนินการ</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total_pending}</p>
                  <p className="text-[0.65rem] text-gray-500 mt-1">ต้องดำเนินการจัดการ</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Success Rate Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">อัตราการสั่งซื้อสำเร็จ</p>
                  <p className="text-lg font-bold text-gray-900">{stats.successful_today}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">อัตราสำเร็จ {stats.success_rate}%</p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Today Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ยอดขายวันนี้</p>
                  <p className="text-lg font-bold text-gray-900">฿{formatCurrency(stats.sales_today)}</p>
                  <p className="text-[0.65rem] text-green-600 mt-1">+7% จากเมื่อวาน</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order List Section */}
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
                  placeholder="ค้นหาเลขออเดอร์"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select value={selectedDate} onValueChange={(value: string) => {
                setSelectedDate(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-9 w-[120px] text-xs">
                  <SelectValue placeholder="วันนี้" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value: string) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending">รอการชำระเงิน</SelectItem>
                  <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                  <SelectItem value="shipped">กำลังจัดส่ง</SelectItem>
                  <SelectItem value="delivered">จัดส่งสำเร็จ</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : paginatedOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลออเดอร์</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH className="w-[180px] text-xs">หมายเลขออเดอร์</TH>
                      <TH className="w-[200px] text-xs">ลูกค้า</TH>
                      <TH className="w-[120px] text-xs">ยอดการสั่งซื้อ</TH>
                      <TH className="w-[150px] text-xs">จำนวนสินค้าที่สั่งซื้อ</TH>
                      <TH className="w-[140px] text-xs">สถานะการสั่งซื้อ</TH>
                      <TH className="w-[140px] text-xs">สถานะการจัดส่ง</TH>
                      <TH className="w-[180px] text-xs">วันที่การสั่งซื้อ</TH>
                      <TH className="w-[200px] text-xs">การดำเนินการ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {paginatedOrders.map((order) => (
                      <TR key={order.order_id}>
                        <TD>
                          <div className="font-medium text-xs">{formatOrderNumber(order.order_id, order.order_date)}</div>
                        </TD>
                        <TD>
                          <div className="text-xs">
                            <div className="font-medium text-gray-900">คุณ{order.customer_first_name} {order.customer_last_name}</div>
                            <div className="text-gray-500 text-[0.7rem]">{order.customer_email}</div>
                          </div>
                        </TD>
                        <TD>
                          <div className="text-xs font-medium">฿{formatCurrency(order.total_amount)}</div>
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{order.item_count} รายการ</div>
                        </TD>
                        <TD>
                          {getOrderStatusBadge(order.order_status)}
                        </TD>
                        <TD>
                          {getDeliveryStatusBadge(order.delivery_status)}
                        </TD>
                        <TD>
                          <div className="text-xs text-gray-600">{formatDate(order.order_date)}</div>
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[0.7rem] px-2"
                              onClick={() => handleViewDetail(order)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              ดูรายละเอียด
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => handleEditClick(order)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(order)}
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
            {!loading && filteredOrders.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-600">
                  แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredOrders.length)} จาก {filteredOrders.length} รายการ
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${currentPage === pageNum ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        title="รายละเอียดออเดอร์"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">หมายเลขออเดอร์</p>
              <p className="text-sm text-gray-600">{formatOrderNumber(selectedOrder.order_id, selectedOrder.order_date)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">ลูกค้า</p>
              <p className="text-sm text-gray-600">คุณ{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">ยอดการสั่งซื้อ</p>
              <p className="text-sm text-gray-600">฿{formatCurrency(selectedOrder.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">จำนวนสินค้า</p>
              <p className="text-sm text-gray-600">{selectedOrder.item_count} รายการ</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">สถานะการสั่งซื้อ</p>
              <div>{getOrderStatusBadge(selectedOrder.order_status)}</div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">สถานะการจัดส่ง</p>
              <div>{getDeliveryStatusBadge(selectedOrder.delivery_status)}</div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">ที่อยู่จัดส่ง</p>
              <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">วันที่สั่งซื้อ</p>
              <p className="text-sm text-gray-600">{formatDate(selectedOrder.order_date)}</p>
            </div>
            {selectedOrder.notes && (
              <div>
                <p className="text-sm font-semibold mb-2">หมายเหตุ</p>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        title="แก้ไขสถานะออเดอร์"
      >
        {orderToEdit && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">หมายเลขออเดอร์</p>
              <p className="text-sm text-gray-600">{formatOrderNumber(orderToEdit.order_id, orderToEdit.order_date)}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">สถานะการสั่งซื้อ</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอการชำระเงิน</SelectItem>
                  <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
                  <SelectItem value="shipped">กำลังจัดส่ง</SelectItem>
                  <SelectItem value="delivered">จัดส่งสำเร็จ</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseEdit}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={updating}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {updating ? 'กำลังอัปเดต...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="ยืนยันการลบออเดอร์"
      >
        {orderToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบออเดอร์ {formatOrderNumber(orderToDelete.order_id, orderToDelete.order_date)}?
            </p>
            <p className="text-xs text-red-600">การกระทำนี้ไม่สามารถยกเลิกได้</p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleDeleteCancel}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleting ? 'กำลังลบ...' : 'ลบ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
