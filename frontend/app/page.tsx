'use client'

import { useProductStore } from '@/src/store/products';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export default function Page() {
  const products = useProductStore((s) => s.products);
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      <div className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>SKU</TH>
              <TH>Price</TH>
              <TH>Stock</TH>
            </TR>
          </THead>
          <TBody>
            {products.map((p) => (
              <TR key={p.id}>
                <TD>{p.name}</TD>
                <TD>{p.sku}</TD>
                <TD>{p.price.toFixed(2)}</TD>
                <TD>{p.stock}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </main>
  );
}


