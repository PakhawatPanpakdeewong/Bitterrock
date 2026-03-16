# Unit Test Report: database/connection

**หน้าที่เกี่ยวข้อง:** ใช้โดย `lib/fetch-log.ts` และ API ที่ใช้ `@/database/connection` (เช่น fetch-logs API)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `testConnection()` | ทดสอบการเชื่อมต่อ คืน true/false |
| `query(text, params?)` | รัน SQL คืน result และ release client |
| `closePool()` | ปิด pool |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| testConnection | 2 | ✅ ผ่านทั้งหมด |
| query | 2 | ✅ ผ่านทั้งหมด |
| closePool | 1 | ✅ ผ่านทั้งหมด |
| **รวม** | **5** | **✅ ผ่านทั้งหมด** |

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (5/5)
- **ส่วนที่เกี่ยวข้อง:** การเชื่อมต่อ DB ที่ใช้ใน fetch-log และ API ที่ import จาก `database/connection`
