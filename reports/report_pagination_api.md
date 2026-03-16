# Unit Test Report: pagination (API หลายตัว)

**หน้าที่เกี่ยวข้อง:** API ที่มี limit/offset (fetch-logs, orders, discounts, inventory, reviews, product-variants, slips/orders, products)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `parseLimitOffset(limitParam, offsetParam, options?)` | `lib/pagination.ts` | แปลง query limit/offset เป็นตัวเลขที่อยู่ในช่วง (1..maxLimit, offset ≥ 0) |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| parseLimitOffset | 6 | ✅ ผ่านทั้งหมด |

### รายการเทส

- ใช้ default เมื่อ param เป็น null/undefined
- clamp limit ระหว่าง 1 กับ maxLimit
- clamp offset ≥ 0
- รองรับ options (maxLimit, defaultLimit, defaultOffset)
- จัดการ NaN จากสตริงไม่ถูกต้อง
- สตริงว่างใช้ default

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (6/6)
- **ส่วนที่เกี่ยวข้อง:** ทุก API ที่รับ limit/offset จาก query
