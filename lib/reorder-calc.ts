/**
 * Reorder point (ROP) และ Economic Order Quantity (EOQ)
 * ใช้โดย app/api/reorder/route.ts หน้า Reorder / เติมของ
 */

/**
 * Safety stock = (ยอดขายสูงสุดต่อวัน × ระยะนำส่งสูงสุด) − (ยอดขายเฉลี่ยต่อวัน × ระยะนำส่งเฉลี่ย)
 * ค่าติดลบปรับเป็น 0; ปัดขึ้นเป็นจำนวนเต็ม
 */
export function calcSafetyStock(
  maxDailySales: number,
  maxLeadTimeDays: number,
  avgDailySales: number,
  avgLeadTimeDays: number
): number {
  const raw =
    maxDailySales * maxLeadTimeDays - avgDailySales * avgLeadTimeDays;
  return Math.max(0, Math.ceil(raw));
}

/** Reorder Point = (Daily Demand × Lead Time) + Safety Stock (ปัดขึ้น) */
export function calcROP(
  dailyDemand: number,
  leadTime: number,
  safetyStock: number
): number {
  return Math.ceil(dailyDemand * leadTime + safetyStock);
}

/** Economic Order Quantity = √(2 × Annual Demand × Ordering Cost / Holding Cost per unit) (ปัดขึ้น, ขั้นต่ำ 1) */
export function calcEOQ(
  dailyDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  const annualDemand = dailyDemand * 365;
  if (holdingCostPerUnit <= 0) return Math.ceil(annualDemand);
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  return Math.ceil(Math.max(1, eoq));
}
