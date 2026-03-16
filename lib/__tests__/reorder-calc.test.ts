/**
 * Unit tests for lib/reorder-calc.ts - หน้าที่เกี่ยวข้อง: หน้า Reorder / เติมของ (app/reorder, API reorder)
 * Report: report_reorder-calc_reorder.md
 */
import { calcROP, calcEOQ } from '../reorder-calc';

describe('calcROP (Reorder Point)', () => {
  it('computes ROP = ceil(dailyDemand * leadTime + safetyStock)', () => {
    expect(calcROP(5, 7, 10)).toBe(45); // 5*7+10 = 45
    expect(calcROP(0, 7, 10)).toBe(10);
    expect(calcROP(2, 3, 0)).toBe(6);
  });

  it('rounds up fractional result', () => {
    expect(calcROP(1.5, 2, 1)).toBe(4); // 1.5*2+1 = 4
    expect(calcROP(1.1, 2, 0)).toBe(3); // 2.2 -> ceil 3
  });
});

describe('calcEOQ (Economic Order Quantity)', () => {
  it('returns at least 1 when holdingCostPerUnit > 0', () => {
    const eoq = calcEOQ(1, 100, 10);
    expect(eoq).toBeGreaterThanOrEqual(1);
  });

  it('returns ceil(annualDemand) when holdingCostPerUnit <= 0', () => {
    expect(calcEOQ(10, 100, 0)).toBe(3650); // 10*365
    expect(calcEOQ(1, 1, -1)).toBe(365);
  });

  it('EOQ formula: sqrt(2*annualDemand*orderingCost/holdingCostPerUnit)', () => {
    // annualDemand=365, orderingCost=100, holdingCostPerUnit=1
    // eoq = sqrt(2*365*100/1) = sqrt(73000) ≈ 270.18 -> ceil 271
    expect(calcEOQ(1, 100, 1)).toBe(271);
  });

  it('rounds up and enforces minimum 1', () => {
    const small = calcEOQ(0.001, 1, 100);
    expect(small).toBeGreaterThanOrEqual(1);
  });
});
