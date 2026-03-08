'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function SlipViewerPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const paymentId = params.paymentId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId || !paymentId) return;
    const url = `/api/slips/${orderId}/${paymentId}`;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || `HTTP ${res.status}`);
          });
        }
        return res.blob();
      })
      .then((blob) => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setImageUrl(objectUrl);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดสลิปได้');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [orderId, paymentId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/slips">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปค้นหา
          </Button>
        </Link>
      </div>
      <Card className="border-pink-100 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-pink-500" />
            สลิปการชำระเงิน
          </CardTitle>
          <p className="text-sm text-gray-500">
            Order ID: {orderId} | Payment ID: {paymentId}
          </p>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <p>กำลังโหลดสลิป...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-red-600">
              <AlertCircle className="w-10 h-10 mb-3" />
              <p className="font-medium">{error}</p>
              <p className="text-sm text-gray-500 mt-1">
                ตรวจสอบว่า Order ID และ Payment ID ถูกต้อง และมีไฟล์สลิปใน Object Storage
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Path ใน R2: slips/{orderId}/{paymentId}/ (ไฟล์อยู่ภายในโฟลเดอร์นี้)
              </p>
            </div>
          )}
          {!loading && !error && imageUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={imageUrl}
                alt={`Slip for Order ${orderId} Payment ${paymentId}`}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
