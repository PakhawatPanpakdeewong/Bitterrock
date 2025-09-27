'use client'

import { useCategoryStore } from '@/src/store/products';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export default function CategoriesPage() {
  const categories = useCategoryStore((s) => s.categories);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">ประเภทสินค้า</h1>
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
            {categories.map((category) => (
              <TR key={category.category_id}>
                <TD>{category.category_id}</TD>
                <TD>{category.category_name}</TD>
                <TD>{category.description}</TD>
                <TD>{category.created_date}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
