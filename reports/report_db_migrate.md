# Unit Test Report: Database & Migrate

**หน้าที่เกี่ยวข้อง:** `database/db.ts` ใช้โดยทุก API และ auth; `database/scripts/migrate.js` ใช้เมื่อรัน migration

---

## ฟังก์ชันที่ทดสอบ

### database/db.ts

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `testConnection()` | ทดสอบการเชื่อมต่อ DB คืน true/false |
| `query(text, params?)` | รัน SQL และคืน result, release client เสมอ |
| `closePool()` | ปิด pool |

### database/scripts/migrate-utils.js

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `runMigration(pool, migration)` | รัน migration เดียว คืนค่า 'skipped' | 'completed' | 'already_exists' |
| `migrations` | รายการ migration (name, file) |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| database db (testConnection, query, closePool) | 6 | ✅ ผ่านทั้งหมด |
| migrate-utils (migrations, runMigration) | 6 | ✅ ผ่านทั้งหมด |
| **รวม** | **12** | **✅ ผ่านทั้งหมด** |

### รายการเทส (db)

- **testConnection:** คืน true เมื่อ connect สำเร็จ, คืน false เมื่อ connect ล้ม
- **query:** คืนค่าตาม client.query, ส่ง params ได้, release client เสมอ, throw เมื่อ query ล้ม

### รายการเทส (migrate-utils)

- **migrations:** เป็น array ไม่ว่าง, แต่ละตัวมี name และ file
- **runMigration:** คืน 'skipped' เมื่อไฟล์ไม่มี, คืน 'completed' เมื่อ query สำเร็จ, คืน 'already_exists' เมื่อ err.code === '42P07', rethrow เมื่อ error อื่น

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (12/12)
- **ส่วนที่เกี่ยวข้อง:** ทุก API ที่ใช้ `query` จาก `@/database/db`, และสคริปต์ `db:migrate`
