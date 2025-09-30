'use client'

import { useState, useEffect } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Category = {
  category_id: number;
  category_name: string;
  description: string;
  created_date: string;
};

type ApiResponse = {
  success: boolean;
  data: Category[];
  source?: string;
  message?: string;
  available_tables?: string[];
  columns?: string[];
  error?: string;
  details?: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<{
    source?: string;
    message?: string;
    available_tables?: string[];
    columns?: string[];
  }>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/categories');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCategories(data.data);
        setApiInfo({
          source: data.source,
          message: data.message,
          available_tables: data.available_tables,
          columns: data.columns
        });
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">กำลังโหลดข้อมูล...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
              <p className="mb-4">{error}</p>
              <button 
                onClick={fetchCategories}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ลองใหม่
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
        <button 
          onClick={fetchCategories}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* API Information Card */}
      {apiInfo.source && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">ข้อมูลการเชื่อมต่อฐานข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>แหล่งข้อมูล:</strong> {apiInfo.source}</p>
              {apiInfo.message && <p><strong>ข้อความ:</strong> {apiInfo.message}</p>}
              {apiInfo.columns && (
                <p><strong>คอลัมน์:</strong> {apiInfo.columns.join(', ')}</p>
              )}
              {apiInfo.available_tables && (
                <p><strong>ตารางที่มี:</strong> {apiInfo.available_tables.join(', ')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <THead>
                <TR>
                  <TH>รหัสประเภท</TH>
                  <TH>ชื่อประเภท</TH>
                  <TH>คำอธิบาย</TH>
                  <TH>วันที่สร้าง</TH>
                </TR>
              </THead>
              <TBody>
                {categories.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-gray-500 py-8">
                      ไม่พบข้อมูลประเภทสินค้า
                    </TD>
                  </TR>
                ) : (
                  categories.map((category) => (
                    <TR key={category.category_id}>
                      <TD>{category.category_id}</TD>
                      <TD>{category.category_name}</TD>
                      <TD>{category.description}</TD>
                      <TD>{category.created_date}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
