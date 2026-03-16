# Integration Test Report (SoapUI)

**วันที่รัน:** _YYYY-MM-DD_  
**SoapUI โปรเจกต์:** `integration-tests/soapui/KiddyCare-API-soapui-project.xml`  
**Base URL:** http://localhost:3004/api (หรือ 3001 ถ้ารัน production)

---

## สภาพแวดล้อม

| รายการ | ค่า |
|--------|-----|
| Server | npm run dev (port 3004) / npm run start (3001) |
| SoapUI version | _ระบุเวอร์ชัน_ |

---

## ผลการรัน Test Suite

| Test Suite | Test Case | สถานะ | หมายเหตุ |
|------------|------------|--------|----------|
| _ชื่อ Suite_ | _ชื่อ Case_ | ✅ / ❌ | _optional_ |

---

## รายการ Request ที่ทดสอบ

| Request | Method | Path | Expected Status | ผล |
|---------|--------|------|-----------------|-----|
| Login - Valid | POST | /auth/login | 200 | |
| Login - Missing credentials | POST | /auth/login | 400 | |
| Get categories | GET | /categories | 200 | |
| Get orders | GET | /orders | 200 / 401 | |
| _เพิ่มตามที่รัน_ | | | | |

---

## สรุป

- ผ่าน: _จำนวน_
- ไม่ผ่าน: _จำนวน_
- หมายเหตุ: _เช่น ต้อง login ก่อนรัน orders, ใช้ user จริงใน DB สำหรับ login_
