# Unit Test Report: password-utils (hash-passwords)

**หน้าที่เกี่ยวข้อง:** สคริปต์ `database/hash-passwords.ts` (ใช้เมื่อ migrate รหัสผ่านเป็น bcrypt)

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `isBcryptHash(value)` | `database/password-utils.ts` | เช็คว่าสตริงเป็น bcrypt hash หรือไม่ ($2a$, $2b$, $2y$) |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| isBcryptHash | 6 | ✅ ผ่านทั้งหมด |

### รายการเทส

- คืน true สำหรับ prefix $2a$, $2b$, $2y$
- คืน false สำหรับ plain password และสตริงว่าง
- คืน false สำหรับ null, undefined
- คืน false สำหรับ prefix ที่ไม่ใช่ bcrypt (เช่น $2c$, 2a$)

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (6/6)
- **ส่วนที่เกี่ยวข้อง:** สคริปต์ hash-passwords ที่ข้าม user ที่มี hash อยู่แล้ว
