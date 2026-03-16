# Unit Test Report: Auth (Login)

**หน้าที่เกี่ยวข้อง:** หน้า Login (`app/login/page.tsx`), API เข้าสู่ระบบ (`app/api/auth/login/route.ts`) ใช้ `lib/auth.ts`

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| `isAdmin(user)` | ตรวจว่าเป็น admin หรือไม่ (ใช้ใน fetch-logs, user-permissions) |
| `verifyPassword(password, hash)` | ตรวจรหัสผ่านกับ hash (bcrypt) |
| `hashPassword(password)` | สร้าง hash จากรหัสผ่าน |
| `getUserByUsernameOrEmail(usernameOrEmail)` | ดึง user จาก DB ตาม username หรือ email (mock query) |
| `createSession(userId)` | สร้าง session และ set cookie (mock cookies) |
| `getCurrentUser()` | ดึง user ปัจจุบันจาก cookie + DB (mock cookies, query) |
| `deleteSession()` | ลบ session และ userId cookie |
| `updateLastLogin(userId)` | อัปเดต LastLogin ใน DB (mock query) |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| isAdmin | 2 | ✅ ผ่านทั้งหมด |
| verifyPassword | 3 | ✅ ผ่านทั้งหมด |
| hashPassword | 3 | ✅ ผ่านทั้งหมด |
| getUserByUsernameOrEmail | 3 | ✅ ผ่านทั้งหมด |
| createSession | 2 | ✅ ผ่านทั้งหมด |
| getCurrentUser | 4 | ✅ ผ่านทั้งหมด |
| deleteSession | 1 | ✅ ผ่านทั้งหมด |
| updateLastLogin | 2 | ✅ ผ่านทั้งหมด |
| **รวม** | **20** | **✅ ผ่านทั้งหมด** |

### รายการเทส

**isAdmin**
- คืน true เมื่อ StaffRole เป็น 'admin' (ไม่สนใจตัวพิมพ์)
- คืน false เมื่อไม่ใช่ admin

**verifyPassword**
- ผ่านเมื่อรหัสผ่านตรงกับ hash
- ไม่ผ่านเมื่อรหัสผ่านไม่ตรง
- ไม่ผ่านเมื่อส่งรหัสผ่านว่างกับ hash ที่ถูกต้อง

**hashPassword**
- คืนค่าเป็น string ที่ไม่ว่าง
- คืนค่า hash คนละค่าเมื่อ hash รหัสเดียวกันสองครั้ง (มี salt)
- hash ที่ได้ใช้กับ verifyPassword แล้วได้ true

**getUserByUsernameOrEmail**
- คืน null เมื่อไม่มีแถวใน DB
- คืน StaffUser เมื่อมี user (และเรียก query ถูก parameter)
- คืน null เมื่อ query throw และไม่ throw ไปข้างบน

**createSession**
- คืน session id รูปแบบ `session_<timestamp>_<random>`
- เรียก cookie set ด้วย userId ที่ส่งเข้าไป

**getCurrentUser**
- คืน null เมื่อไม่มี cookie userId
- คืน StaffUser เมื่อมี userId และ DB มีแถว active
- คืน null เมื่อ DB ไม่มีแถว หรือ query throw

**deleteSession**
- เรียก cookie delete('session'), delete('userId') และ set('session'/'userId', '', { maxAge: 0 })

**updateLastLogin**
- เรียก query อัปเดต LastLogin กับ StaffID ที่ส่ง
- ไม่ throw เมื่อ query ล้ม (แค่ log error)

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (20/20)
- **ส่วนที่เกี่ยวข้อง:** หน้า Login และ API `/api/auth/login`
