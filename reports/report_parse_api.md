# Unit Test Report: parse (API หลายตัว)

**หน้าที่เกี่ยวข้อง:** API ที่รับ ID หรือตัวเลขจาก query/body (orders, reviews, categories, brands, attribute-values, ...)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `safeParseInt(value, defaultValue, radix?)` | `lib/parse.ts` | แปลงสตริงเป็น integer คืน default เมื่อไม่ใช่ตัวเลข |
| `safeParseFloat(value, defaultValue)` | `lib/parse.ts` | แปลงสตริงเป็น float คืน default เมื่อไม่ใช่ตัวเลข |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| safeParseInt | 4 | ✅ ผ่านทั้งหมด |
| safeParseFloat | 3 | ✅ ผ่านทั้งหมด |
| **รวม** | **7** | **✅ ผ่านทั้งหมด** |

### รายการเทส

**safeParseInt**
- คืน default เมื่อ null/undefined/''
- แปลงสตริงตัวเลขที่ถูกต้อง
- คืน default เมื่อสตริงไม่ใช่ตัวเลข (และกรณีมีทศนิยมได้ parseInt ส่วนจำนวนเต็ม)
- รองรับ radix

**safeParseFloat**
- คืน default เมื่อ null/undefined/''
- แปลงสตริง float ที่ถูกต้อง
- คืน default เมื่อสตริงไม่ใช่ตัวเลข

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (7/7)
- **ส่วนที่เกี่ยวข้อง:** ทุก API ที่ต้อง parse ID หรือตัวเลขจาก query/body
