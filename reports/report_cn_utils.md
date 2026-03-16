# Unit Test Report: `cn` (Utils)

**หน้าที่เกี่ยวข้อง:** ใช้ในทุกหน้า ผ่าน `components/utils/cn.ts` สำหรับ merge class names (clsx + tailwind-merge)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `cn(...inputs)` | `components/utils/cn.ts` | รวม class names และจัดการ conflicting Tailwind classes ด้วย twMerge |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| cn (class name merge utility) | 8 | ✅ ผ่านทั้งหมด |

### รายการเทส

1. **returns empty string when no arguments** – ไม่ส่งอาร์กิวเมนต์ ได้สตริงว่าง
2. **merges single string** – ส่งสตริงเดียว ได้ค่าตามที่ส่ง
3. **merges multiple strings** – รวมหลายสตริงด้วย space
4. **ignores falsy values** – ข้าม `undefined`, `null`, `false`
5. **handles conditional classes with tailwind-merge (later wins)** – คลาส Tailwind ที่ชนกัน ใช้ค่าตัวหลัง (เช่น `p-4`, `p-2` → `p-2`)
6. **handles arrays** – รองรับอาร์เรย์ของ class names
7. **handles object with conditional classes** – รองรับ object แบบ `{ active: true, disabled: false }`
8. **handles mixed inputs** – ผสม string, array, object ในครั้งเดียว

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (8/8)
- **ส่วนที่เกี่ยวข้อง:** ทุกหน้าที่ใช้ UI components ที่เรียก `cn()` (ปุ่ม, การ์ด, input, layout ฯลฯ)
