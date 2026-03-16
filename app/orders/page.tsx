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
  ChevronsRight,
  Package,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useNotification } from '@/components/ui/notification';

type Order = {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
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

type OrderItemDetail = {
  order_item_id: number;
  product_name_th: string;
  product_name_en: string;
  sku: string;
  quantity_ordered: number;
  unit_price: number;
  total_price: number;
  attribute_values: string | null;
};

type OrderDetail = Order & {
  items: OrderItemDetail[];
  tracking_number?: string | null;
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
  const { notify } = useNotification();
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
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ order: Order; newStatus: string } | null>(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);

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
        notify(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`, { type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      notify('เกิดข้อผิดพลาดในการโหลดข้อมูล', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setOrderDetail(null);
    try {
      const res = await fetch(`/api/orders/${order.order_id}`);
      const data = await res.json();
      if (data.ok) {
        setOrderDetail(data.order);
      } else {
        setOrderDetail({ ...order, items: [] });
      }
    } catch {
      setOrderDetail({ ...order, items: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  // ขั้นตอนที่อนุญาต: pending -> confirmed -> shipped -> delivered (ไม่สามารถข้ามหรือย้อนกลับได้)
  // ถ้าจ่ายเงินสำเร็จแล้ว (confirmed/shipped/delivered) ห้ามยกเลิก
  const getNextAllowedStatuses = (order: Order): { value: string; label: string }[] => {
    const s = order.order_status === 'delivered' ? 'shipped' : order.order_status;
    const isPaymentCompleted = order.payment_status === 'completed' || 
      ['confirmed', 'shipped', 'delivered'].includes(order.order_status);
    switch (s) {
      case 'pending':
        return isPaymentCompleted 
          ? [{ value: 'confirmed', label: 'ยืนยันออเดอร์' }]
          : [
              { value: 'confirmed', label: 'ยืนยันออเดอร์' },
              { value: 'cancelled', label: 'ถูกยกเลิก' },
            ];
      case 'confirmed':
        return [{ value: 'shipped', label: 'กำลังจัดส่ง' }]; // จ่ายเงินแล้ว ไม่ให้ยกเลิก
      case 'shipped':
        return [{ value: 'delivered', label: 'จัดส่งเสร็จสิ้น' }];
      case 'cancelled':
        return [];
      default:
        return [
          { value: 'confirmed', label: 'ยืนยันออเดอร์' },
          { value: 'cancelled', label: 'ถูกยกเลิก' },
        ];
    }
  };

  const canEditOrder = (order: Order) => {
    const s = order.order_status === 'delivered' ? 'shipped' : order.order_status;
    // อนุญาตให้แก้ไขถึงสถานะ shipped (เพื่อเปลี่ยนเป็น delivered) แต่ไม่ให้แก้ cancelled
    return s !== 'cancelled';
  };

  const canDeleteOrder = (order: Order) => {
    if (order.payment_status === 'completed') return false;
    if (['confirmed', 'shipped', 'delivered'].includes(order.order_status)) return false;
    return true;
  };

  const canMarkDelivered = (order: Order) => {
    return order.order_status === 'shipped' && order.payment_status === 'completed';
  };

  const handleMarkDelivered = async (order: Order) => {
    if (!canMarkDelivered(order)) return;
    if (!confirm('ยืนยันว่าสินค้าถูกส่งถึงลูกค้าแล้ว?')) return;
    try {
      setMarkingDelivered(true);
      const res = await fetch(`/api/orders/${order.order_id}/delivered`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        await fetchOrders();
        notify('ยืนยันจัดส่งถึงลูกค้าเรียบร้อยแล้ว', { type: 'success' });
      } else {
        notify(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`, { type: 'error' });
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      notify('เกิดข้อผิดพลาดในการยืนยันจัดส่ง', { type: 'error' });
    } finally {
      setMarkingDelivered(false);
    }
  };

  const handleEditClick = (order: Order) => {
    if (!canEditOrder(order)) return;
    setOrderToEdit(order);
    const allowed = getNextAllowedStatuses(order);
    setEditStatus(allowed[0]?.value || '');
    setTrackingNumber('');
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setOrderToEdit(null);
    setEditStatus('');
    setTrackingNumber('');
  };

  const handleSaveClick = () => {
    if (!orderToEdit) return;
    if (editStatus === 'shipped' && !trackingNumber.trim()) {
      notify('กรุณากรอกเลข Tracking Number ก่อนเปลี่ยนสถานะเป็นกำลังจัดส่ง', { type: 'warning' });
      return;
    }
    setPendingEdit({ order: orderToEdit, newStatus: editStatus });
    setIsConfirmEditModalOpen(true);
  };

  const handleConfirmEditCancel = () => {
    setIsConfirmEditModalOpen(false);
    setPendingEdit(null);
  };

  const handleEditSubmit = async () => {
    if (!pendingEdit) return;
    const { order, newStatus } = pendingEdit;

    try {
      setUpdating(true);

      if (newStatus === 'delivered') {
        // ใช้ API เฉพาะทางสำหรับยืนยันจัดส่งสำเร็จ
        const res = await fetch(`/api/orders/${order.order_id}/delivered`, { method: 'POST' });
        const data = await res.json();

        if (data.ok) {
          await fetchOrders();
          setIsConfirmEditModalOpen(false);
          setPendingEdit(null);
          setIsEditModalOpen(false);
          setOrderToEdit(null);
          notify('ยืนยันจัดส่งถึงลูกค้าเรียบร้อยแล้ว', { type: 'success' });
        } else {
          notify(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`, { type: 'error' });
        }
      } else {
        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.order_id,
            order_status: newStatus,
            tracking_number: newStatus === 'shipped' ? trackingNumber.trim() : undefined,
          }),
        });

        const data = await res.json();

        if (data.ok) {
          await fetchOrders();
          setIsConfirmEditModalOpen(false);
          setPendingEdit(null);
          setIsEditModalOpen(false);
          setOrderToEdit(null);
          notify('อัปเดตสถานะออเดอร์สำเร็จ', { type: 'success' });
        } else {
          notify(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`, { type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      notify('เกิดข้อผิดพลาดในการอัปเดตออเดอร์', { type: 'error' });
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
        notify('ลบออเดอร์สำเร็จ', { type: 'success' });
      } else {
        notify(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`, { type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      notify('เกิดข้อผิดพลาดในการลบออเดอร์', { type: 'error' });
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

  // สถานะการสั่งซื้อ (จาก paymentstatus): สำเร็จ, รอการชำระเงิน, ยกเลิก
  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800">สำเร็จ</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-yellow-100 text-yellow-800">รอการชำระเงิน</span>;
      case 'failed':
      case 'refunded':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-red-100 text-red-800">ยกเลิก</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-gray-100 text-gray-800">{paymentStatus || 'รอการชำระเงิน'}</span>;
    }
  };

  // สถานะออเดอร์/การจัดส่ง: ยังไม่ดำเนินการ, ยืนยันออเดอร์, กำลังจัดส่ง, ถูกยกเลิก
  const getOrderStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-blue-100 text-blue-800">ยืนยันออเดอร์</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-pink-100 text-pink-800">กำลังจัดส่ง</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800">จัดส่งถึงลูกค้าแล้ว</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-red-100 text-red-800">ถูกยกเลิก</span>;
      case 'pending':
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
    const orderDate = new Date(order.order_date);
    orderDate.setHours(0, 0, 0, 0);

    if (selectedDate === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = orderDate.getTime() === today.getTime();
    } else if (selectedDate === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6); // รวมวันนี้ย้อนหลัง 7 วัน
      weekAgo.setHours(0, 0, 0, 0);
      matchesDate = orderDate.getTime() >= weekAgo.getTime() && orderDate.getTime() <= today.getTime();
    }

    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      notify('ไม่มีข้อมูลสำหรับส่งออก', { type: 'warning' });
      return;
    }

    const header = [
      'หมายเลขออเดอร์',
      'ชื่อลูกค้า',
      'อีเมลลูกค้า',
      'ยอดการสั่งซื้อ',
      'จำนวนสินค้า',
      'สถานะการสั่งซื้อ',
      'สถานะการจัดส่ง',
      'วันที่สั่งซื้อ'
    ];

    const rows = filteredOrders.map((order) => [
      formatOrderNumber(order.order_id, order.order_date),
      `คุณ${order.customer_first_name} ${order.customer_last_name}`,
      order.customer_email,
      formatCurrency(order.total_amount),
      order.item_count.toString(),
      order.payment_status,
      order.order_status,
      formatDate(order.order_date)
    ]);

    const csvBody = [header, ...rows]
      .map((cols) =>
        cols
          .map((value) => {
            const v = value.replace(/"/g, '""');
            return `"${v}"`;
          })
          .join(',')
      )
      .join('\r\n');

    // เพิ่ม BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const csvContent = '\uFEFF' + csvBody;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const filename = `orders-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}.csv`;
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                onClick={handleExport}
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
            <CardTitle className="text-base font-bold">รายการสั่งซื้อ</CardTitle>
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
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="ช่วงวันที่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
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
                  <SelectItem value="pending">ยังไม่ดำเนินการ</SelectItem>
                  <SelectItem value="confirmed">ยืนยันออเดอร์</SelectItem>
                  <SelectItem value="shipped">กำลังจัดส่ง</SelectItem>
                  <SelectItem value="cancelled">ถูกยกเลิก</SelectItem>
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
                          {getPaymentStatusBadge(order.payment_status)}
                        </TD>
                        <TD>
                          {getOrderStatusBadge(order.order_status)}
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
                              disabled={!canEditOrder(order)}
                              title={!canEditOrder(order) ? 'ออเดอร์นี้ไม่สามารถแก้ไขสถานะได้ (กำลังจัดส่งหรือถูกยกเลิก)' : 'แก้ไขสถานะ'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(order)}
                              disabled={!canDeleteOrder(order)}
                              title={!canDeleteOrder(order) ? 'ไม่สามารถลบออเดอร์ที่ชำระเงินสำเร็จแล้วได้' : 'ลบออเดอร์'}
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
        className="max-w-lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent" />
              </div>
            ) : orderDetail ? (
              <>
                {/* Order number & status row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
                  <p className="text-base font-medium text-gray-900">
                    {formatOrderNumber(orderDetail.order_id, orderDetail.order_date)}
                  </p>
                  <div className="flex gap-2">
                    {getPaymentStatusBadge(orderDetail.payment_status)}
                    {getOrderStatusBadge(orderDetail.order_status)}
                  </div>
                </div>

                {/* Customer & date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50/80 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      <User className="w-3.5 h-3.5" />
                      ลูกค้า
                    </div>
                    <p className="text-sm font-medium text-gray-900">คุณ{orderDetail.customer_first_name} {orderDetail.customer_last_name}</p>
                    <a href={`mailto:${orderDetail.customer_email}`} className="flex items-center gap-1.5 mt-1 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      {orderDetail.customer_email}
                    </a>
                  </div>
                  <div className="rounded-xl bg-gray-50/80 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      วันที่สั่งซื้อ
                    </div>
                    <p className="text-sm text-gray-900">{formatDate(orderDetail.order_date)}</p>
                  </div>
                </div>

                {/* Product list */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    <Package className="w-3.5 h-3.5" />
                    รายการสินค้า ({orderDetail.items?.length || orderDetail.item_count} รายการ)
                  </div>
                  {orderDetail.items && orderDetail.items.length > 0 ? (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="divide-y divide-gray-50">
                        {orderDetail.items.map((item) => (
                          <div key={item.order_item_id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.product_name_th || item.product_name_en}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">{item.sku}</span>
                                {item.attribute_values && (
                                  <span className="text-xs text-gray-400">• {item.attribute_values}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-4">
                              <span className="text-xs text-gray-500">
                                x{item.quantity_ordered}
                              </span>
                              <span className="text-sm font-medium text-gray-900 min-w-[4rem] text-right">
                                ฿{formatCurrency(item.total_price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                      ไม่พบรายการสินค้า
                    </div>
                  )}
                </div>

                {/* Shipping address */}
                <div className="rounded-xl bg-gray-50/80 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    ที่อยู่จัดส่ง
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{orderDetail.shipping_address}</p>
                </div>

                {/* Tracking number */}
                {orderDetail.tracking_number && (
                  <div className="rounded-xl bg-green-50/80 p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      <Package className="w-3.5 h-3.5" />
                      เลขติดตามพัสดุ
                    </div>
                    <p className="text-sm font-semibold text-green-800">
                      {orderDetail.tracking_number}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">ยอดรวม</span>
                  <span className="text-lg font-semibold text-gray-900">฿{formatCurrency(orderDetail.total_amount)}</span>
                </div>

                {orderDetail.notes && (
                  <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-100">
                    <p className="text-xs font-medium text-amber-800/80 mb-1">หมายเหตุ</p>
                    <p className="text-sm text-amber-900/90">{orderDetail.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">ไม่สามารถโหลดรายละเอียดได้</p>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal - Redesigned */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        title="เปลี่ยนสถานะออเดอร์"
      >
        {orderToEdit && (
          <div className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">หมายเลขออเดอร์</p>
              <p className="text-sm font-semibold text-gray-900">{formatOrderNumber(orderToEdit.order_id, orderToEdit.order_date)}</p>
              <div className="flex items-center gap-2 mt-2">
                {getPaymentStatusBadge(orderToEdit.payment_status)}
                {getOrderStatusBadge(orderToEdit.order_status)}
              </div>
            </div>

            {/* Visual flow */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">ขั้นตอนการดำเนินการ (ทำตามลำดับเท่านั้น)</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { key: 'pending', label: 'ยังไม่ดำเนินการ' },
                  { key: 'confirmed', label: 'ยืนยันออเดอร์' },
                  { key: 'shipped', label: 'กำลังจัดส่ง' },
                  { key: 'delivered', label: 'จัดส่งเสร็จสิ้น' },
                ].map((step, index, arr) => {
                  const current = orderToEdit.order_status === 'delivered' ? 'shipped' : orderToEdit.order_status;
                  const flowOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
                  const isCurrent = step.key === current;
                  const isPast = flowOrder.indexOf(step.key) < flowOrder.indexOf(current);

                  const baseClasses =
                    'inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium whitespace-nowrap border transition-colors';

                  const stateClasses = isCurrent
                    ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-sm'
                    : isPast
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-400 border-gray-200';

                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <div className={`${baseClasses} ${stateClasses}`}>
                        <span
                          className={`mr-1.5 h-4 w-4 rounded-full border text-[0.6rem] flex items-center justify-center ${
                            isCurrent || isPast
                              ? 'border-current bg-white/80'
                              : 'border-gray-300 bg-white/40'
                          }`}
                        >
                          {flowOrder.indexOf(step.key) + 1}
                        </span>
                        <span>{step.label}</span>
                      </div>
                      {index < arr.length - 1 && (
                        <span className="text-gray-300 text-xs shrink-0">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next step - use buttons for clarity */}
            <div>
              <p className="text-sm font-semibold mb-2">เลือกขั้นตอนถัดไป</p>
              <div className="space-y-2">
                {getNextAllowedStatuses(orderToEdit).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditStatus(opt.value)}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                      editStatus === opt.value
                        ? 'border-pink-500 bg-pink-50 text-pink-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{editStatus === opt.value ? '●' : '○'}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              {editStatus === 'shipped' && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Tracking Number (ต้องกรอก)</p>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                    placeholder="ตัวอักษร A-Z / เลข 0-9 จำนวน 13 ตัว"
                    maxLength={13}
                    className="h-9 text-sm"
                  />
                </div>
              )}
              {(orderToEdit.payment_status === 'completed' || ['confirmed', 'shipped', 'delivered'].includes(orderToEdit.order_status)) && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <span>✓</span> ชำระเงินสำเร็จแล้ว — ไม่สามารถยกเลิกออเดอร์ได้
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={handleCloseEdit}>
                ปิด
              </Button>
              <Button 
                onClick={handleSaveClick}
                disabled={updating || !editStatus}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {updating ? 'กำลังอัปเดต...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Edit Modal */}
      <Modal
        isOpen={isConfirmEditModalOpen}
        onClose={handleConfirmEditCancel}
        title="ยืนยันการเปลี่ยนสถานะ"
      >
        {pendingEdit && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะออเดอร์ {formatOrderNumber(pendingEdit.order.order_id, pendingEdit.order.order_date)} เป็น &quot;{getNextAllowedStatuses(pendingEdit.order).find(o => o.value === pendingEdit.newStatus)?.label || pendingEdit.newStatus}&quot;?
            </p>
            {pendingEdit.newStatus === 'cancelled' && (
              <p className="text-sm text-red-600 font-medium">
                เมื่อยกเลิกแล้วจะไม่สามารถกลับไปขั้นตอนต่างๆ ได้
              </p>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleConfirmEditCancel}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={updating}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {updating ? 'กำลังอัปเดต...' : 'ยืนยัน'}
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
