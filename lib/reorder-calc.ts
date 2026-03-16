/**
 * Reorder point (ROP) และ Economic Order Quantity (EOQ)
 * ใช้โดย app/api/reorder/route.ts หน้า Reorder / เติมของ
 */

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
