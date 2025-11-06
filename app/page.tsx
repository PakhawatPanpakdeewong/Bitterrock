'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';

type InventoryItem = {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_date: string | null;
  created_date: string | null;
  product_name_th: string;
  product_name_en: string;
  sub_category_name: string | null;
  variant_sku: string | null;
  price: number | null;
  is_active: boolean | null;
  attribute_value_th: string | null;
  attribute_value_en: string | null;
  warehouse_name: string;
};

export default function HomePage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory?limit=1000');
      const data = await res.json();
      
      if (data.ok) {
        // Map variant_price to price for consistency
        const items = (data.items || []).map((item: any) => ({
          ...item,
          price: item.variant_price ? parseFloat(item.variant_price) : null
        }));
        setInventoryItems(items);
      } else {
        console.error('Error fetching inventory:', data.error);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.price || 0) * item.available_quantity), 0);
  const totalProducts = inventoryItems.length;
  const productsInStock = inventoryItems.filter(item => item.available_quantity > 0).reduce((sum, item) => sum + item.available_quantity, 0);
  const outOfStockCount = inventoryItems.filter(item => item.available_quantity === 0).length;
  const lowStockCount = inventoryItems.filter(item => item.available_quantity > 0 && item.available_quantity <= 10).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ยินดีต้อนรับสู่ KiddyCare</h1>
          <p className="text-sm text-gray-600">ระบบจัดการสินค้าแม่และเด็กภายในร้านค้า</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Value Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">มูลค่ารวมทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : `฿${formatCurrency(totalValue)}`}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">รายการสินค้าทั้งหมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : totalProducts}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products in Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าในสต็อก</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : productsInStock}
                  </p>
                </div>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าหมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : outOfStockCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">สินค้าใกล้หมด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading ? '...' : lowStockCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



