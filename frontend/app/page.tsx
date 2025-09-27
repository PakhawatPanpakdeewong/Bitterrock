import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">ยินดีต้อนรับสู่ KiddyCare</h1>
        <p className="text-lg text-muted-foreground mb-12">ระบบจัดการสินค้าเด็กที่ครบครัน</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">ประเภทสินค้า</CardTitle>
            <CardDescription>จัดการหมวดหมู่สินค้าและการจัดระเบียบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">รายการสั่งซื้อ</CardTitle>
            <CardDescription>ติดตามและจัดการคำสั่งซื้อของลูกค้า</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">สินค้าทั้งหมด</CardTitle>
            <CardDescription>จัดการแคตตาล็อกสินค้าของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">คลังสินค้า</CardTitle>
            <CardDescription>ตรวจสอบระดับสต็อกและความพร้อมใช้งาน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



