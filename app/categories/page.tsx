'use client'

import { useState, useEffect } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

type Category = {
  category_id: number;
  category_name: string;
  description: string;
  created_date: string;
};

type ApiResponse = {
  success: boolean;
  data: Category[] | Category;
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
  
  // Subcategories state and filter
  const [subCategories, setSubCategories] = useState<Array<{
    sub_category_id: string;
    sub_category_name: string;
    description: string | null;
    category_id: number | null;
    category_name: string | null;
  }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [subLoading, setSubLoading] = useState<boolean>(false);
  const [subError, setSubError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories(selectedCategoryId);
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCategories(Array.isArray(data.data) ? data.data : []);
        // After categories are loaded, also load subcategories (unfiltered)
        await fetchSubCategories('all');
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    try {
      setSubLoading(true);
      setSubError(null);
      const url = categoryId && categoryId !== 'all' 
        ? `/api/sub_categories?category_id=${encodeURIComponent(categoryId)}` 
        : '/api/sub_categories';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSubCategories(Array.isArray(json.data) ? json.data : []);
      } else {
        setSubError(json.error || 'Failed to fetch subcategories');
      }
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">หมวดย่อย</h1>
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
        <h1 className="text-2xl font-semibold">หมวดย่อย</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
              <p className="mb-4">{error}</p>
              <Button onClick={fetchCategories}>
                ลองใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">หมวดย่อย</h1>
        <div />
      </div>

      {/* Subcategories Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">หมวดย่อย (Subcategories)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="category-filter">กรองตามประเภท</Label>
              <Select value={selectedCategoryId} onValueChange={(value: string) => setSelectedCategoryId(value)}>
                <SelectTrigger id="category-filter" className="w-[260px]">
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => fetchSubCategories(selectedCategoryId)}>
              รีเฟรชหมวดย่อย
            </Button>
          </div>

          {subLoading ? (
            <div className="text-sm text-gray-600">กำลังโหลดหมวดย่อย...</div>
          ) : subError ? (
            <div className="text-sm text-red-600">{subError}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <THead>
                  <TR>
                    <TH>รหัสย่อย</TH>
                    <TH>ชื่อหมวดย่อย</TH>
                    <TH>ประเภทหลัก</TH>
                    <TH>คำอธิบาย</TH>
                  </TR>
                </THead>
                <TBody>
                  {subCategories.length === 0 ? (
                    <TR>
                      <TD colSpan={4} className="text-center text-gray-500 py-8">
                        ไม่พบข้อมูลหมวดย่อย
                      </TD>
                    </TR>
                  ) : (
                    subCategories.map((sc) => (
                      <TR key={sc.sub_category_id}>
                        <TD>{sc.sub_category_id}</TD>
                        <TD>{sc.sub_category_name}</TD>
                        <TD>{sc.category_name}</TD>
                        <TD>{sc.description}</TD>
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}

