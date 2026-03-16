# SoapUI Integration Testing - KiddyCare API (Legacy)

**โปรเจกต์ใช้ Postman สำหรับ integration testing แล้ว** — ดูที่ `integration-tests/postman/` และ `README_Postman.md`

เอกสารด้านล่างเก็บไว้สำหรับผู้ที่ยังใช้ SoapUI เท่านั้น.

---

ใช้ SoapUI (หรือ SoapUI Open Source) สำหรับทดสอบ API แบบ integration โดยส่ง request จริงไปที่เซิร์ฟเวอร์และตรวจสอบ response

---

## 1. สิ่งที่ต้องมี

- **SoapUI** หรือ **SoapUI Open Source**  
  - ดาวน์โหลด: https://www.soapui.org/downloads/soapui-open-source/
- **แอป Next.js ต้องรันอยู่** (dev หรือ start) ก่อนรันเทส

---

## 2. สร้างโปรเจกต์ SoapUI (แนะนำ — หลีกเลี่ยง Error เปิดไฟล์)

ถ้าเปิดไฟล์ `KiddyCare-API-soapui-project.xml` แล้วเกิด **NullPointerException** (เช่น `wssContainer is null`) ให้ข้ามการเปิดไฟล์และสร้างโปรเจกต์ใหม่ใน SoapUI แทน:

1. เปิด SoapUI → **File → New REST Project**
2. ใส่ **Initial WADL / URL**: `http://localhost:3004/api`  
   (หรือใช้ **Create empty project** แล้วเพิ่ม Service เอง)
3. ถ้าสร้างแบบ empty:
   - คลิกขวาที่โปรเจกต์ → **New REST Service from URI**
   - ใส่ **URI**: `http://localhost:3004/api` → OK
4. เพิ่ม **Resource** ตามต้องการ:
   - คลิกขวาที่ REST Service → **New Resource**
   - **Path**: `/auth/login` → เพิ่ม **Method** เป็น POST
   - ใน Request ตั้ง **Media Type** = application/json, **Request body** = `{"usernameOrEmail":"admin","password":"รหัสผ่านทดสอบ"}`
   - ทำซ้ำสำหรับ path อื่นตามตารางในหัวข้อ 4 และ 7

วิธีนี้จะไม่โดน bug เวอร์ชัน SoapUI ที่เกิด NullPointerException ตอนเปิด project XML

---

## 2.1 ทางเลือก: เปิดโปรเจกต์จากไฟล์

1. เปิด SoapUI → **File → Open Project** → เลือก  
   `integration-tests/soapui/KiddyCare-API-soapui-project.xml`
2. ถ้าเปิดได้ โปรเจกต์จะแสดง REST Service **KiddyCare API** พร้อม Resources
3. **ถ้าเกิด Error (NullPointerException / wssContainer is null)** ให้ใช้วิธีในหัวข้อ 2 แทน (สร้างโปรเจกต์ใหม่)

---

## 3. รันเซิร์ฟเวอร์ก่อนทดสอบ

```bash
# จาก root โปรเจกต์
npm run dev
```

- Dev server: **http://localhost:3004**
- Base path ของ API: **http://localhost:3004/api**

ถ้ารัน `npm run start` (production mode) จะใช้พอร์ต **3001** — ต้องเปลี่ยน Base URL ใน SoapUI เป็น `http://localhost:3001/api`

---

## 4. Endpoints ที่มีในโปรเจกต์

| Resource        | Method | Path           | หมายเหตุ |
|----------------|--------|----------------|----------|
| auth-login     | POST   | /api/auth/login | Body: `{"usernameOrEmail","password"}` |
| auth-me        | GET    | /api/auth/me    | ต้องมี session cookie |
| auth-logout    | POST   | /api/auth/logout | ลบ session |
| categories     | GET    | /api/categories | ไม่ต้อง login (หรือต้อง ขึ้นกับ middleware) |
| orders         | GET    | /api/orders     | Query: limit, offset, status, search |
| reorder        | GET    | /api/reorder    | รายการเติมของ ROP/EOQ |
| products       | GET    | /api/products   | Query: limit, offset |
| warehouses     | GET    | /api/warehouses | |

---

## 5. สร้าง Test Case / Test Suite ใน SoapUI

1. คลิกขวาที่ **KiddyCare API** → **New Test Suite** (ตั้งชื่อ เช่น "Integration Test Suite 1")
2. คลิกขวาที่ Test Suite → **New Test Case** (ตั้งชื่อ เช่น "Auth and Categories")
3. ใน Test Case → **Add Step** → **REST Request** แล้วเลือก Request ที่มีอยู่ (เช่น Login - Valid, Get categories)
4. ใส่ **Assertions** ในแต่ละ Request:
   - **Status** – ตรวจ status code (เช่น 200, 401)
   - **Contains** – ตรวจว่ามีข้อความใน response (เช่น `"ok":true`, `"error"`)
   - **JSONPath** – ตรวจค่าใน JSON (เช่น `$.ok`, `$.user.StaffID`)

### ตัวอย่าง Test Flow

1. **Login - Valid** → คาดว่า 200, body มี `"ok": true`
2. **Login - Missing credentials** → คาดว่า 400, body มี `"error"`
3. **Get categories** → คาดว่า 200, body มี `"success": true` หรือ `"data"`

---

## 6. เปลี่ยน Base URL (พอร์ต / โฮสต์)

- ใน SoapUI: เปิด **KiddyCare API** → **Service Endpoint** เปลี่ยนเป็น `http://localhost:3004` (หรือ 3001)
- หรือในแต่ละ Request ให้แก้ **Endpoint** เป็น URL ที่ต้องการ

---

## 7. รายการ API เพิ่มเติม (สำหรับเพิ่มใน SoapUI)

| Method | Path | Body / Query |
|--------|------|----------------|
| GET | /api/inventory | limit, offset |
| GET | /api/fetch-logs | limit, offset, source (ต้อง admin) |
| GET | /api/reviews | limit, offset |
| GET | /api/discounts | limit, offset |
| GET | /api/users | limit, offset |
| GET | /api/attributes | |
| GET | /api/attribute-values | attribute_id |
| GET | /api/sub_categories | category_id |
| GET | /api/brands | sub_category_id, category_id |
| GET | /api/product-variants | product_id, limit, offset |
| GET | /api/reorder-params | |
| GET | /api/slips/orders | limit, offset |
| GET | /api/orders/{id} | orderId ใน path |
| POST | /api/orders/{id}/delivered | orderId ใน path |
| GET | /api/slips/{orderId}/{paymentId} | path params |

---

## 8. รันเทสและบันทึกผล

- รันทั้ง Test Suite: คลิกขวาที่ Test Suite → **Run**
- รันทีละ Test Case: คลิกขวาที่ Test Case → **Run**
- บันทึกผลลงรายงานได้ที่ `reports/report_integration_soapui.md` (ใช้ template ด้านล่าง)

---

## 9. แก้ปัญหา (Troubleshooting)

### NullPointerException: wssContainer is null

- เกิดเมื่อเปิดไฟล์โปรเจกต์ XML ที่สร้างด้วยรูปแบบ/เวอร์ชันอื่น SoapUI จะพยายามโหลดส่วน WS-Security แล้ว error
- **วิธีแก้:** ไม่ต้องเปิดไฟล์ XML — ใช้ **หัวข้อ 2** สร้างโปรเจกต์ใหม่ใน SoapUI (New REST Project / New REST Service from URI) แล้วเพิ่ม Resource กับ Request เองตามตารางในหัวข้อ 4 และ 7
