'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        // Redirect to home page
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardContent className="p-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center p-3">
              <img
                src="/KiddyCareLogo.png"
                alt="KiddyCare Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              ระบบการจัดการคลังสินค้า
            </h1>
            <p className="text-lg text-gray-700">ร้าน KiddyCare</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username/Email Field */}
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-gray-700">
                ชื่อหรืออีเมลล์
              </Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="กรุณาใส่ชื่อหรืออีเมลล์ของคุณ"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                รหัสผ่าน
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="กรุณาใส่รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

