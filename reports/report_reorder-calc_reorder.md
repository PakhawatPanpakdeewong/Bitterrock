# Unit Test Report: reorder-calc (Reorder / เติมของ)

**หน้าที่เกี่ยวข้อง:** หน้า Reorder (`app/reorder/page.tsx`), API `/api/reorder` — คำนวณ ROP และ EOQ

---

## ฟังก์ชันที่ทดสอบ

| ฟังก์ชัน | ไฟล์ | คำอธิบาย |
|----------|------|----------|
| `calcROP(dailyDemand, leadTime, safetyStock)` | `lib/reorder-calc.ts` | Reorder Point = ปัดขึ้น(demand×leadTime + safetyStock) |
| `calcEOQ(dailyDemand, orderingCost, holdingCostPerUnit)` | `lib/reorder-calc.ts` | Economic Order Quantity = √(2×annual×ordering/holding) ปัดขึ้น, ขั้นต่ำ 1 |

---

## ผลการทดสอบ

| ชุดเทส | จำนวนเทส | สถานะ |
|--------|----------|--------|
| calcROP | 2 | ✅ ผ่านทั้งหมด |
| calcEOQ | 4 | ✅ ผ่านทั้งหมด |
| **รวม** | **6** | **✅ ผ่านทั้งหมด** |

### รายการเทส

**calcROP**
- คำนวณ ROP ตามสูตร และปัดขึ้นเมื่อเป็นทศนิยม

**calcEOQ**
- คืนค่าขั้นต่ำ 1 เมื่อ holdingCostPerUnit > 0
- เมื่อ holdingCostPerUnit ≤ 0 คืน ceil(annualDemand)
- ตรวจสูตร EOQ กับค่าตัวอย่าง
- ปัดขึ้นและไม่ต่ำกว่า 1

---

## สรุป

- **สถานะ:** ผ่านทั้งหมด (6/6)
- **ส่วนที่เกี่ยวข้อง:** หน้าเติมของ (ROP/EOQ) และ API reorder
