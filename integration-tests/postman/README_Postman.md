# Postman Integration Testing - KiddyCare API

ใช้ Postman สำหรับทดสอบ API แบบ integration โดยส่ง request จริงไปที่เซิร์ฟเวอร์และรัน Tests (assertions) ใน Collection

---

## 1. สิ่งที่ต้องมี

- **Postman** (Desktop หรือ Web)  
  - ดาวน์โหลด: https://www.postman.com/downloads/
- **แอป Next.js ต้องรันอยู่** ก่อนรันเทส

---

## 2. นำเข้า Collection และ Environment

1. เปิด Postman
2. **Import**:
   - กด **Import** → เลือกไฟล์  
     `integration-tests/postman/KiddyCare-API.postman_collection.json`  
   - เลือกไฟล์  
     `integration-tests/postman/KiddyCare-Local.postman_environment.json`
3. เลือก Environment **KiddyCare - Local (dev)** ที่มุมขวาบน (dropdown)
4. แก้ค่า **password** ใน Environment ให้ตรงกับรหัสผ่านของ user ที่ใช้ทดสอบ (เช่น admin):
   - คลิกไอคอนตา → **KiddyCare - Local (dev)** → แก้ `password` → Save

---

## 3. รันเซิร์ฟเวอร์ก่อนทดสอบ

```bash
# จาก root โปรเจกต์
npm run dev
```

- Dev: **http://localhost:3004** (ใช้ค่า `baseUrl` ใน Environment)
- Production (`npm run start`): พอร์ต **3001** — สร้าง Environment ใหม่หรือแก้ `baseUrl` เป็น `http://localhost:3001`

---

## 4. รัน Integration Tests

### รันทั้ง Collection (Collection Runner)

1. คลิกขวาที่ **KiddyCare API - Integration Tests** → **Run collection**
2. เลือก Environment: **KiddyCare - Local (dev)**
3. กด **Run KiddyCare API...** จะรันทุก request ตามลำดับ และแสดงผล Tests (ผ่าน/ไม่ผ่าน)

### รันทีละ Request

- เปิด request ที่ต้องการ → กด **Send** → ดูแท็บ **Test Results** ว่าผ่านกี่ข้อ

### ลำดับที่แนะนำ (ถ้ารันทีละอัน)

1. **Login - Valid** ก่อน (เพื่อให้ได้ session cookie สำหรับ request อื่นที่ต้อง login)
2. ตามด้วย **Get current user (me)**, **Get categories**, **Orders**, **Reorder**, **Products**, **Warehouses**
3. **Login - Missing credentials** ตรวจ 400
4. **Logout** ท้าย

---

## 5. โฟลเดอร์และ Requests ใน Collection

| โฟลเดอร์ | Request | Method | หมายเหตุ |
|-----------|---------|--------|----------|
| **Auth** | Login - Valid | POST | Body: usernameOrEmail, password (ใช้ตัวแปร {{password}}) |
| | Login - Missing credentials (400) | POST | คาด 400, มี error |
| | Get current user (me) | GET | ต้องมี cookie หลัง Login |
| | Logout | POST | |
| **Categories** | Get categories | GET | คาด 200, success + data |
| **Orders** | Get orders list | GET | Query: limit, offset |
| **Reorder** | Get reorder list (ROP/EOQ) | GET | คาด 200, ok + items |
| **Products** | Get products | GET | Query: limit, offset |
| **Warehouses** | Get warehouses | GET | |

แต่ละ request มี **Tests** ตรวจ status code และเนื้อหา JSON แล้ว

---

## 6. เพิ่ม Request / API อื่น

| Method | URL (ต่อจาก {{baseUrl}}) | Body / Query |
|--------|---------------------------|--------------|
| GET | /api/inventory | limit, offset |
| GET | /api/fetch-logs | limit, offset, source (ต้อง admin) |
| GET | /api/reviews | limit, offset |
| GET | /api/discounts | limit, offset |
| GET | /api/users | limit, offset |
| GET | /api/attributes | — |
| GET | /api/attribute-values | attribute_id |
| GET | /api/sub_categories | category_id |
| GET | /api/brands | sub_category_id, category_id |
| GET | /api/product-variants | product_id, limit, offset |
| GET | /api/reorder-params | — |
| GET | /api/slips/orders | limit, offset |
| GET | /api/orders/{{orderId}} | path |
| POST | /api/orders/{{orderId}}/delivered | path |

เพิ่มใน Collection แล้วใส่ Tests ในแท็บ **Tests** (เช่น `pm.test('Status 200', () => pm.response.to.have.status(200));`)

---

## 7. บันทึกผลและรายงาน

- หลังรัน Collection Runner จะเห็นสรุปผ่าน/ไม่ผ่าน
- บันทึกผลลง `reports/report_integration_postman.md` (ใช้ template ในไฟล์นั้น)
