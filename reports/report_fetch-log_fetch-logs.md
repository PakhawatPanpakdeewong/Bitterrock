# Unit Test Report: fetch-log (Fetch Logs)

**หน้าที่เกี่ยวข้อง:** หน้า Fetch Logs (`app/fetch-logs/page.tsx`) และทุกที่ที่เรียก `logFetchFailure` จาก `lib/fetch-log.ts`

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `logFetchFailure(entry)` | บันทึกการ fetch ล้มเหลวลงตาราง fetchlogs (ไม่ throw เมื่อ DB ล้ม) |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| logFetchFailure | 3 | ✅ ผ่านทั้งหมด |

### รายการเทส

1. **calls query with correct params when all fields provided** – ส่ง source, resourceType, resourceId, errorMessage, httpStatus ถูกต้อง
2. **passes null for optional fields when omitted** – resourceId, errorMessage, httpStatus ไม่ส่ง จะเป็น null ใน params
3. **does not throw when query fails** – เมื่อ query reject จะไม่ throw (fail silently และ log error)

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (3/3)
- **ส่วนที่เกี่ยวข้อง:** หน้า Fetch Logs และบริการที่ log การ fetch ล้มเหลว
