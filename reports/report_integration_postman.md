# Integration Test Report (Postman)

**วันที่รัน:** _YYYY-MM-DD_  
**Collection:** `integration-tests/postman/KiddyCare-API.postman_collection.json`  
**Environment:** KiddyCare - Local (dev)  
**Base URL:** http://localhost:3004 (หรือ 3001 ถ้ารัน production)

---

## สภาพแวดล้อม

| รายการ | ค่า |
|--------|-----|
| Server | npm run dev (port 3004) / npm run start (3001) |
| Postman | _ระบุเวอร์ชัน หรือ Desktop/Web_ |

---

## ผลการรัน Collection

| โฟลเดอร์ | Request | สถานะ | หมายเหตุ |
|----------|---------|--------|----------|
| Auth | Login - Valid | ✅ / ❌ | |
| Auth | Login - Missing credentials (400) | ✅ / ❌ | |
| Auth | Get current user (me) | ✅ / ❌ | |
| Auth | Logout | ✅ / ❌ | |
| Categories | Get categories | ✅ / ❌ | |
| Orders | Get orders list | ✅ / ❌ | |
| Reorder | Get reorder list (ROP/EOQ) | ✅ / ❌ | |
| Products | Get products | ✅ / ❌ | |
| Warehouses | Get warehouses | ✅ / ❌ | |

---

## สรุป

- ผ่าน: _จำนวน_
- ไม่ผ่าน: _จำนวน_
- หมายเหตุ: _เช่น ต้องตั้ง password ใน Environment ให้ตรงกับ user ใน DB_
