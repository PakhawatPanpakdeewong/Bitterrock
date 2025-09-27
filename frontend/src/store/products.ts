import { create } from 'zustand';

export type Category = {
  category_id: number;
  category_name: string;
  description: string;
  created_date: string;
};

type CategoryState = {
  categories: Category[];
};

const initialCategories: Category[] = [
  { 
    category_id: 1, 
    category_name: 'Baby Feeding', 
    description: 'Bottles, pacifiers, and feeding accessories for infants', 
    created_date: '2024-01-15' 
  },
  { 
    category_id: 2, 
    category_name: 'Diapering', 
    description: 'Diapers, wipes, and changing essentials', 
    created_date: '2024-01-20' 
  },
  { 
    category_id: 3, 
    category_name: 'Baby Gear', 
    description: 'Strollers, car seats, and travel accessories', 
    created_date: '2024-02-01' 
  },
  { 
    category_id: 4, 
    category_name: 'Nursing & Pumping', 
    description: 'Breast pumps, nursing bras, and feeding supplies', 
    created_date: '2024-02-10' 
  },
];

export const useCategoryStore = create<CategoryState>(() => ({ categories: initialCategories }));



