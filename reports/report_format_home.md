# Unit Test Report: format (Home, Inventory, Orders, Fetch-logs)

**หน้าที่เกี่ยวข้อง:** หน้า Home, Inventory, Orders, Fetch-logs, Products, Slips, Promotions, Reviews ใช้สำหรับแสดงตัวเลขและวันที่

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `formatCurrency(value)` | `lib/format.ts` | แปลงตัวเลขเป็นสตริงรูปแบบสกุลเงิน (ทศนิยม 2 ตำแหน่ง, locale th-TH) |
| `formatDate(dateString)` | `lib/format.ts` | แปลงวันที่เป็นสตริงรูปแบบ th-TH (ปี, เดือน, วัน, เวลา) หรือ 'N/A' |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| formatCurrency | 4 | ✅ ผ่านทั้งหมด |
| formatDate | 3 | ✅ ผ่านทั้งหมด |
| **รวม** | **7** | **✅ ผ่านทั้งหมด** |

### รายการเทส

1. **formats number with 2 decimal places** – แสดงทศนิยม 2 ตำแหน่ง (เช่น 100 → "100.00" หรือ "100,00")
2. **returns string with digits** – คืนค่าเป็น string ที่มีตัวเลข
3. **rounds to 2 decimal places** – ปัดเป็น 2 ตำแหน่ง (99.999 → 100.00, 10.126 → 10.13)
4. **handles large numbers** – จำนวนมากยัง format ได้ถูกต้อง

**formatDate**
- คืน 'N/A' สำหรับ null, undefined, ''
- คืนสตริงที่ format แล้วสำหรับ ISO date ที่ถูกต้อง
- คืน 'N/A' สำหรับสตริงวันที่ไม่ถูกต้อง

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (7/7)
- **ส่วนที่เกี่ยวข้อง:** หน้า Home, Inventory, Orders, Fetch-logs ฯลฯ (แสดงเงินและวันที่)
