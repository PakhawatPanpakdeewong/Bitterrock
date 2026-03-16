# Unit Test Report: middleware-auth (Middleware)

**หน้าที่เกี่ยวข้อง:** `middleware.ts` — ทุกหน้าที่ต้อง login (ยกเว้น /login, API, static)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `getMiddlewareAction(pathname, hasSession, hasUserId)` | `lib/middleware-auth.ts` | คืนค่า redirect ไป `/login` หรือ `/` หรือ next ตาม path และ session |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| getMiddlewareAction | 5 | ✅ ผ่านทั้งหมด |

### รายการเทส

1. **redirects to / when on /login with session and userId** – อยู่ /login และมี session → redirect ไป /
2. **next when on /login without session** – อยู่ /login แต่ไม่มี session/userId → next
3. **redirects to /login when protected route and no session** – อยู่ path ที่ต้อง login แต่ไม่มี session หรือ userId → redirect ไป /login
4. **next when protected route with session and userId** – อยู่ path ปกติและมี session → next
5. **treats /login/xxx as public** – path ที่ขึ้นต้นด้วย /login ถือเป็น public

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (5/5)
- **ส่วนที่เกี่ยวข้อง:** Middleware ที่ตัดสิน redirect หรือ next สำหรับทุก route (ยกเว้น API และ static)
