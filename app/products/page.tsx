import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockProducts = [
  {
    id: 1,
    category: "ขวดนมพลาสติก",
    name: "Natur SMART biomimic Anti-colic bottle",
    sku: "NS-001-BL",
    price: 199.00,
    colors: [
      { name: "สีฟ้าสูตรทะเล", value: "sea-blue", selected: true },
      { name: "สีชมพู", value: "pink", selected: false },
      { name: "สีส้ม", value: "orange", selected: false }
    ],
    details: "ขวดนมพลาสติกคุณภาพสูง พร้อมระบบป้องกันการสะสมอากาศ ดีไซน์เออร์โกโนมิกส์ที่เหมาะสำหรับทารกอายุ 6 เดือนขึ้นไป",
    image: "/KiddyCareLogo.png" // Using existing logo as placeholder
  },
  {
    id: 2,
    category: "จุกนมซิลิโคน",
    name: "Premium Silicone Nipple Set",
    sku: "PS-002-CL",
    price: 89.00,
    colors: [
      { name: "สีใส", value: "clear", selected: true },
      { name: "สีขาว", value: "white", selected: false },
      { name: "สีเบจ", value: "beige", selected: false }
    ],
    details: "จุกนมซิลิโคนคุณภาพพรีเมียม นุ่มนวลและปลอดภัยสำหรับทารก เหมาะสำหรับขวดนมทุกขนาด",
    image: "/KiddyCareLogo.png" // Using existing logo as placeholder
  },
  {
    id: 3,
    category: "ผ้าอ้อมเด็ก",
    name: "Ultra Soft Baby Diaper",
    sku: "UD-003-WH",
    price: 299.00,
    colors: [
      { name: "สีขาว", value: "white", selected: true },
      { name: "สีครีม", value: "cream", selected: false },
      { name: "สีฟ้าอ่อน", value: "light-blue", selected: false }
    ],
    details: "ผ้าอ้อมเด็กนุ่มนวล ซึมซับได้ดี ไม่ระคายเคืองผิว เหมาะสำหรับทารกทุกวัย",
    image: "/KiddyCareLogo.png" // Using existing logo as placeholder
  }
];

export default function ProductsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">สินค้าทั้งหมด</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col">
                {/* Product Images */}
                <div className="p-4">
                  <div className="flex gap-3 mb-4">
                    {/* Main product image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    {/* Additional product views */}
                    <div className="flex flex-col gap-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Category and Name */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">{product.category}</h3>
                    <h2 className="text-base font-semibold line-clamp-2">{product.name}</h2>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 bg-gray-50 flex-1">
                  <div className="space-y-4">
                    {/* Details */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">รายละเอียด</h4>
                      <p className="text-gray-600 text-xs line-clamp-3">{product.details}</p>
                    </div>

                    {/* SKU */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">รหัสสินค้า SKU</h4>
                      <p className="text-gray-600 text-sm">{product.sku}</p>
                    </div>

                    {/* Color Selection */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">ประเภทสี</h4>
                      <div className="flex gap-1 flex-wrap">
                        {product.colors.map((color) => (
                          <Button
                            key={color.value}
                            variant={color.selected ? "default" : "outline"}
                            size="sm"
                            className="text-xs px-2 py-1 h-7"
                          >
                            {color.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">ราคา</h4>
                      <p className="text-lg font-bold text-blue-600">{product.price.toFixed(2)} บาท</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
