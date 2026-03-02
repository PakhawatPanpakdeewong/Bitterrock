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
  Star,
  CheckCircle,
  XCircle,
  User,
  Package,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

type Review = {
  review_id: number;
  product_id: number;
  variant_id: number | null;
  customer_id: number;
  rating: number;
  review_text: string | null;
  review_date: string;
  is_approved: boolean;
  product_name_th: string;
  product_name_en: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
};

type ReviewStats = {
  total: number;
  pending: number;
  approved: number;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setReviews(data.items);
        setStats(data.stats);
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReviews();
  };

  const handleSearch = () => {
    fetchReviews();
  };

  const handleApprove = async (review: Review) => {
    if (review.is_approved) return;
    try {
      setUpdatingId(review.review_id);
      const res = await fetch(`/api/reviews/${review.review_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: true }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchReviews();
        alert('อนุมัติรีวิวเรียบร้อยแล้ว');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error approving review:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติรีวิว');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedReview(null);
  };

  const handleReject = async (review: Review) => {
    if (!review.is_approved) return;
    try {
      setUpdatingId(review.review_id);
      const res = await fetch(`/api/reviews/${review.review_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: false }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchReviews();
        alert('ยกเลิกการอนุมัติรีวิวเรียบร้อยแล้ว');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-green-100 text-green-800 whitespace-nowrap">
          อนุมัติแล้ว
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
        รอตรวจสอบ
      </span>
    );
  };

  const today = new Date();
  const todayStr = today.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const updateTime = today.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">ตรวจสอบรีวิว</h1>
              <p className="text-xs text-gray-600 mt-1">ตรวจสอบและอนุมัติรีวิวจากลูกค้า</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รีวิวทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รอตรวจสอบ</p>
                  <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">อนุมัติแล้ว</p>
                  <p className="text-lg font-bold text-gray-900">{stats.approved}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">รายการรีวิว</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า, อีเมล, รีวิว"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 px-3" onClick={handleSearch}>
                ค้นหา
              </Button>
              <Select
                value={selectedStatus}
                onValueChange={(value: string) => setSelectedStatus(value)}
              >
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลรีวิว</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-fixed">
                  <THead>
                    <TR>
                      <TH className="w-[16.67%] text-xs">สินค้า</TH>
                      <TH className="w-[16.67%] text-xs">ลูกค้า</TH>
                      <TH className="w-[16.67%] text-xs">คะแนน</TH>
                      <TH className="w-[16.67%] text-xs">วันที่</TH>
                      <TH className="w-[16.67%] text-xs">สถานะ</TH>
                      <TH className="w-[16.67%] text-xs">การดำเนินการ</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {reviews.map((review) => (
                      <TR key={review.review_id}>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-xs">
                              <div className="font-medium text-gray-900">
                                {review.product_name_th || review.product_name_en}
                              </div>
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-xs">
                              <div className="font-medium text-gray-900">
                                คุณ{review.customer_first_name} {review.customer_last_name}
                              </div>
                              <div className="text-gray-500 text-[0.7rem]">{review.customer_email}</div>
                            </div>
                          </div>
                        </TD>
                        <TD>{renderStars(review.rating)}</TD>
                        <TD>
                          <div className="text-xs text-gray-600">{formatDate(review.review_date)}</div>
                        </TD>
                        <TD>{getStatusBadge(review.is_approved)}</TD>
                        <TD>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[0.7rem] px-2"
                              onClick={() => handleViewDetail(review)}
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              ดูรายละเอียด
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[0.7rem] px-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleApprove(review)}
                              disabled={review.is_approved || updatingId === review.review_id}
                              title={review.is_approved ? 'อนุมัติแล้ว' : 'อนุมัติรีวิว'}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              อนุมัติ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[0.7rem] px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleReject(review)}
                              disabled={!review.is_approved || updatingId === review.review_id}
                              title={!review.is_approved ? 'รีวิวยังไม่อนุมัติ' : 'ยกเลิกการอนุมัติ'}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              ยกเลิก
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        title="รายละเอียดรีวิว"
        className="max-w-lg"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5" />
                สินค้า
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedReview.product_name_th || selectedReview.product_name_en}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" />
                ลูกค้า
              </div>
              <p className="text-sm font-medium text-gray-900">
                คุณ{selectedReview.customer_first_name} {selectedReview.customer_last_name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{selectedReview.customer_email}</p>
            </div>
            <div className="rounded-xl bg-gray-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5" />
                คะแนน
              </div>
              {renderStars(selectedReview.rating)}
            </div>
            <div className="rounded-xl bg-gray-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                รายละเอียดรีวิว
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedReview.review_text || '-'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{formatDate(selectedReview.review_date)}</span>
              {getStatusBadge(selectedReview.is_approved)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
