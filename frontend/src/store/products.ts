import { create } from 'zustand';

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type ProductState = {
  products: Product[];
};

const initialProducts: Product[] = [
  { id: 1, name: 'Anti-Colic Bottle 150ml', sku: 'BN001A150', price: 350, stock: 25 },
  { id: 2, name: 'Diapers NB Pack (48)', sku: 'DIAPER002NB', price: 299, stock: 120 },
  { id: 3, name: 'Electric Breast Pump (Dual)', sku: 'BPUMP003E', price: 3500, stock: 10 },
];

export const useProductStore = create<ProductState>(() => ({ products: initialProducts }));



