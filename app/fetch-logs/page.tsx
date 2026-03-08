'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FileWarning, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

type FetchLogItem = {
  id: number;
  source: string;
  resourceType: string;
  resourceId: string | null;
  errorMessage: string | null;
  httpStatus: number | null;
  createdAt: string;
};

export default function FetchLogsPage() {
  const [logs, setLogs] = useState<FetchLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.ok && data.user) {
        const userRole = data.user.StaffRole?.toLowerCase();
        if (userRole !== 'admin') {
          window.location.href = '/';
          return;
        }
        setCurrentUser({ role: userRole });
        fetchLogs();
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      window.location.href = '/login';
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String((page - 1) * limit));
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }
      const res = await fetch(`/api/fetch-logs?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.items || []);
        setTotal(data.total || 0);
      } else {
        if (data.error?.includes('Forbidden') || res.status === 403) {
          window.location.href = '/';
          return;
        }
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sourceFilter, currentUser?.role]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('th-TH', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return dateStr;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่ได้รับอนุญาต</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileWarning className="w-6 h-6 text-amber-500" />
                บันทึกการดึงข้อมูลไม่สำเร็จ
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                รายการที่ดึงข้อมูลไม่ได้ (เช่น สลิป, API ต่างๆ) รวมไว้ในหน้านี้
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
              className="h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              โหลดใหม่
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">รายการล็อก</CardTitle>
              <Select value={sourceFilter} onValueChange={(v: string) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="แหล่งที่มา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแหล่งที่มา</SelectItem>
                  <SelectItem value="slips">สลิป (Slips)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500 text-sm">กำลังโหลด...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                ไม่มีรายการที่ดึงข้อมูลไม่สำเร็จ
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH className="text-xs w-24">แหล่งที่มา</TH>
                        <TH className="text-xs w-28">ประเภท</TH>
                        <TH className="text-xs w-32">Resource ID</TH>
                        <TH className="text-xs">ข้อความผิดพลาด</TH>
                        <TH className="text-xs w-20">HTTP</TH>
                        <TH className="text-xs w-40">วันที่/เวลา</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {logs.map((log) => (
                        <TR key={log.id}>
                          <TD className="text-xs font-medium">{log.source}</TD>
                          <TD className="text-xs">{log.resourceType}</TD>
                          <TD className="text-xs text-gray-600">{log.resourceId || '-'}</TD>
                          <TD className="text-xs text-red-600 max-w-[300px] truncate" title={log.errorMessage || ''}>
                            {log.errorMessage || '-'}
                          </TD>
                          <TD className="text-xs">{log.httpStatus ?? '-'}</TD>
                          <TD className="text-xs text-gray-600">{formatDate(log.createdAt)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-600">
                      แสดง {(page - 1) * limit + 1} ถึง {Math.min(page * limit, total)} จาก {total} รายการ
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs px-2">
                        หน้า {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
