'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Wallet,
  Users,
  Receipt,
  PiggyBank,
  ShoppingCart,
  Package,
  Trophy,
  Percent,
  Coins,
  LayoutDashboard,
  Bell,
  AlertTriangle,
  Sparkles,
  PackageX,
  CalendarRange,
  Calculator,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/components/utils/cn';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

type DailySummary = {
  summary_date: string;
  total_revenue: number;
  total_quantity: number;
};

type TopProduct = {
  product_id: number;
  product_name_th: string;
  product_name_en: string | null;
  total_revenue: number;
  total_quantity: number;
};

type TopProductProfit = TopProduct & { total_profit: number };

type ProfitProductRow = {
  product_id: number;
  product_name_th: string;
  product_name_en: string | null;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
  total_quantity: number;
};

type ProfitCategoryRow = {
  category_id: number;
  category_name_th: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
};

type ProfitDeepDive = {
  summary: {
    line_revenue: number;
    cogs: number;
    gross_profit: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
    note: string;
  };
  by_product: ProfitProductRow[];
  by_category: ProfitCategoryRow[];
};

type InventoryInsights = {
  total_available_units: number;
};

type CategoryMonthLeader = {
  category_id: number;
  category_name_th: string;
  total_revenue: number;
  total_quantity: number;
};

type ThisMonthLeaders = {
  label_th: string;
  month_start: string | null;
  top_products: TopProduct[];
  top_categories: CategoryMonthLeader[];
};

type DailyProfitPoint = {
  summary_date: string;
  gross_profit: number;
};

type MonthlySalesPoint = {
  month_start: string;
  total_revenue: number;
};

type SalesSurpriseAlert = {
  product_id: number;
  product_name_th: string;
  revenue_30d: number;
  revenue_prev_30d: number;
  growth_pct: number | null;
};

type LowMarginAlert = {
  product_id: number;
  product_name_th: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
};

type StagnantAlert = {
  variant_id: number;
  product_name_th: string;
  variant_sku: string | null;
  available_quantity: number;
  sold_90d: number;
};

type ChartsAndAlerts = {
  daily_profit: DailyProfitPoint[];
  monthly_sales: MonthlySalesPoint[];
};

type AlertsPayload = {
  sales_surprise: SalesSurpriseAlert[];
  low_margin: LowMarginAlert[];
  stagnant: StagnantAlert[];
  rules: {
    surprise_min_prev_revenue: number;
    surprise_growth_factor: number;
    low_margin_pct: number;
    min_revenue_for_low_margin_alert: number;
    stagnant_min_stock: number;
    stagnant_days: number;
  };
};

type SalesSummaryResponse = {
  ok: boolean;
  totals?: {
    total_revenue: number;
    total_quantity: number;
    summary_days: number;
  };
  daily?: DailySummary[];
  topProducts?: TopProduct[];
  topProductsByRevenue?: TopProduct[];
  topProductsByProfit?: TopProductProfit[];
  this_month?: ThisMonthLeaders;
  inventory?: InventoryInsights;
  profitDeepDive?: ProfitDeepDive;
  charts?: ChartsAndAlerts;
  alerts?: AlertsPayload;
  error?: string;
};

type DashboardOverview = {
  ok?: boolean;
  quick?: {
    sales_today: number;
    orders_today: number;
    sales_this_week: number;
    orders_this_week: number;
    sales_this_month_mtd: number;
    orders_this_month_mtd: number;
  };
  revenue_mtd?: number;
  orders_mtd?: number;
  new_customers_mtd?: number;
  expenses_mtd?: number;
  net_profit_mtd?: number;
  comparison?: {
    label: string;
    growth_pct: {
      revenue: number | null;
      orders: number | null;
      new_customers: number | null;
      expenses: number | null;
      net_profit: number | null;
    };
  };
};

function formatGrowthPct(pct: number | null): { text: string; tone: 'up' | 'down' | 'flat' | 'na' } {
  if (pct === null) return { text: 'ไม่มีข้อมูลเปรียบเทียบ', tone: 'na' };
  if (pct === 0 || Number.isNaN(pct)) return { text: '0%', tone: 'flat' };
  const sign = pct > 0 ? '+' : '';
  const text = `${sign}${pct.toFixed(1)}%`;
  if (pct > 0) return { text, tone: 'up' };
  if (pct < 0) return { text, tone: 'down' };
  return { text, tone: 'flat' };
}

function GrowthBadge({ pct }: { pct: number | null }) {
  const { text, tone } = formatGrowthPct(pct);
  const Icon = tone === 'up' ? TrendingUp : tone === 'down' ? TrendingDown : Minus;
  const cls =
    tone === 'up'
      ? 'text-emerald-700 bg-emerald-50 ring-emerald-200/70'
      : tone === 'down'
        ? 'text-rose-700 bg-rose-50 ring-rose-200/70'
        : tone === 'flat'
          ? 'text-gray-700 bg-gray-50 ring-gray-200/70'
          : 'text-gray-500 bg-gray-50/90 ring-gray-200/60';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums ring-1',
        cls
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {text}
    </span>
  );
}

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

type SalesSectionId = 'overview' | 'sales' | 'charts' | 'profit' | 'stock' | 'methodology';

const SALES_SECTION_TABS: {
  id: SalesSectionId;
  label: string;
  Icon: typeof LayoutDashboard;
}[] = [
  { id: 'overview', label: 'ภาพรวม', Icon: LayoutDashboard },
  { id: 'sales', label: 'ยอดขาย · กราฟหลัก', Icon: BarChart3 },
  { id: 'charts', label: 'กราฟเชิงลึก · แจ้งเตือน', Icon: Bell },
  { id: 'profit', label: 'รายได้และกำไร', Icon: Coins },
  { id: 'stock', label: 'บริหารสต็อก', Icon: Package },
  { id: 'methodology', label: 'ขั้นตอนการคำนวณ', Icon: Calculator },
];

/** ตัวเลือกเดือนสำหรับกราฟยอดขายหลัก (ค่า 1–12 ตรงกับ d.month) */
const CHART_MONTH_OPTIONS: { value: number | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งปี' },
  { value: 1, label: 'ม.ค.' },
  { value: 2, label: 'ก.พ.' },
  { value: 3, label: 'มี.ค.' },
  { value: 4, label: 'เม.ย.' },
  { value: 5, label: 'พ.ค.' },
  { value: 6, label: 'มิ.ย.' },
  { value: 7, label: 'ก.ค.' },
  { value: 8, label: 'ส.ค.' },
  { value: 9, label: 'ก.ย.' },
  { value: 10, label: 'ต.ค.' },
  { value: 11, label: 'พ.ย.' },
  { value: 12, label: 'ธ.ค.' },
];

export default function SalesSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesSummaryResponse | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [expandedSalesSurprise, setExpandedSalesSurprise] = useState<Set<number>>(() => new Set());
  /** กราฟหลัก: 'all' = ทุกปีในข้อมูล, ไม่กรองเดือนเมื่อปี = all */
  const [chartFilterYear, setChartFilterYear] = useState<number | 'all'>('all');
  const [chartFilterMonth, setChartFilterMonth] = useState<number | 'all'>('all');
  const [activeSection, setActiveSection] = useState<SalesSectionId>('overview');

  const isAdminViewer = (userRole ?? '').toLowerCase() === 'admin';
  const visibleTabs = isAdminViewer
    ? SALES_SECTION_TABS
    : SALES_SECTION_TABS.filter((t) => t.id !== 'profit' && t.id !== 'methodology');

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        if (json?.ok && json?.user?.StaffRole) {
          setUserRole(String(json.user.StaffRole).toLowerCase());
          return;
        }
        setUserRole(null);
      } catch {
        setUserRole(null);
      }
    };
    fetchRole();
  }, []);

  useEffect(() => {
    if (!isAdminViewer && (activeSection === 'profit' || activeSection === 'methodology')) {
      setActiveSection('overview');
    }
  }, [activeSection, isAdminViewer]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const [summaryRes, overviewRes] = await Promise.all([
          fetch('/api/sales-summary'),
          fetch('/api/dashboard-overview'),
        ]);
        const json: SalesSummaryResponse = await summaryRes.json();
        const overviewJson = await overviewRes.json();
        setData(json);
        setOverview(overviewJson.ok ? (overviewJson as DashboardOverview) : null);
      } catch (err) {
        console.error('Error loading sales summary:', err);
        setData({ ok: false, error: 'ไม่สามารถโหลดข้อมูลสรุปการขายได้' });
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const totals = data?.totals || {
    total_revenue: 0,
    total_quantity: 0,
    summary_days: 0,
  };

  const dailyRaw = data?.daily || [];

  const daily = dailyRaw.map((d) => {
    const dateObj = new Date(d.summary_date);
    const oneJan = new Date(dateObj.getFullYear(), 0, 1);
    const dayOfYear =
      (Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()) -
        Date.UTC(oneJan.getFullYear(), oneJan.getMonth(), oneJan.getDate())) /
        86400000 +
      1;
    const week = Math.ceil(dayOfYear / 7);
    return {
      ...d,
      dateLabel: dateObj.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
      }),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      week,
    };
  });

  const dailyForChart =
    chartFilterYear === 'all'
      ? daily
      : daily.filter((d) => {
          if (d.year !== chartFilterYear) return false;
          if (chartFilterMonth === 'all') return true;
          return d.month === chartFilterMonth;
        });

  const chartYearOptions = [...new Set(daily.map((d) => d.year))].sort((a, b) => b - a);

  // Aggregate for week, month and quarter views (กราฟหลัก — ตามตัวกรองปี/เดือน)
  const weeklyMap = new Map<string, { label: string; total_revenue: number }>();
  const monthlyMap = new Map<string, { label: string; total_revenue: number }>();
  const quarterlyMap = new Map<string, { label: string; total_revenue: number }>();

  dailyForChart.forEach((d) => {
    const wKey = `${d.year}-W${d.week.toString().padStart(2, '0')}`;
    const wLabel = `สัปดาห์ ${d.week} (${d.year + 543})`;
    const w = weeklyMap.get(wKey) || { label: wLabel, total_revenue: 0 };
    w.total_revenue += d.total_revenue;
    weeklyMap.set(wKey, w);

    const ymKey = `${d.year}-${d.month.toString().padStart(2, '0')}`;
    const monthLabel = new Date(d.year, d.month - 1, 1).toLocaleDateString('th-TH', {
      month: 'short',
      year: '2-digit',
    });
    const m = monthlyMap.get(ymKey) || { label: monthLabel, total_revenue: 0 };
    m.total_revenue += d.total_revenue;
    monthlyMap.set(ymKey, m);

    const quarter = Math.floor((d.month - 1) / 3) + 1;
    const qKey = `${d.year}-Q${quarter}`;
    const qLabel = `Q${quarter} ${d.year + 543}`;
    const q = quarterlyMap.get(qKey) || { label: qLabel, total_revenue: 0 };
    q.total_revenue += d.total_revenue;
    quarterlyMap.set(qKey, q);
  });

  const weekly = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const quarterly = Array.from(quarterlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, v]) => v);

  const dailySortedForChart = [...dailyForChart].sort(
    (a, b) => new Date(a.summary_date).getTime() - new Date(b.summary_date).getTime()
  );

  const chartData: { label?: string; dateLabel?: string; total_revenue: number }[] =
    viewMode === 'day'
      ? dailySortedForChart
      : viewMode === 'week'
      ? weekly
      : viewMode === 'month'
      ? monthly
      : quarterly;

  const topProducts = data?.topProducts || [];
  const topByRevenue = data?.topProductsByRevenue || [];
  const topByProfit = data?.topProductsByProfit || [];
  const thisMonthLeaders = data?.this_month;
  const inv = data?.inventory;
  const profit = data?.profitDeepDive;
  const charts = data?.charts;
  const alerts = data?.alerts;
  const surpriseFactor = alerts?.rules?.surprise_growth_factor ?? 1.35;
  const surpriseMinPrev = alerts?.rules?.surprise_min_prev_revenue ?? 150;
  const surpriseBump = 200; // ต้องตรงกับเงื่อนไขใน API /api/sales-summary
  const salesSurprise = alerts?.sales_surprise ?? [];
  const toggleSalesSurprise = (productId: number) => {
    setExpandedSalesSurprise((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const dailyRevenueLast90 = [...daily]
    .sort((a, b) => new Date(a.summary_date).getTime() - new Date(b.summary_date).getTime())
    .slice(-90);

  const monthlyFromApi = (charts?.monthly_sales ?? []).map((m) => ({
    ...m,
    label: new Date(m.month_start).toLocaleDateString('th-TH', {
      month: 'short',
      year: 'numeric',
    }),
  }));

  const dailyProfitLine = (charts?.daily_profit ?? []).map((d) => {
    const dateObj = new Date(d.summary_date);
    return {
      ...d,
      dateLabel: dateObj.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
      }),
    };
  });

  const categoryCompare = (profit?.by_category ?? []).slice(0, 10).map((c) => ({
    name:
      c.category_name_th.length > 24
        ? `${c.category_name_th.slice(0, 22)}…`
        : c.category_name_th,
    fullName: c.category_name_th,
    revenue: c.revenue,
    gross_profit: c.gross_profit,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              สรุปภาพรวมการขาย
            </h1>
            <p className="text-sm text-gray-600">
              ข้อมูลทั้งหมดดึงจากฐานข้อมูลจริง — ออเดอร์ รายการสั่งซื้อ สต็อกคลัง และลูกค้า
            </p>
          </div>
        </div>

        <nav
          className="sticky top-0 z-30 -mx-6 border-b border-gray-200/90 bg-gray-50/95 px-4 py-2.5 shadow-sm backdrop-blur-md sm:px-6"
          aria-label="ส่วนของหน้าสรุปการขาย"
        >
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
            {visibleTabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-left text-[0.7rem] font-semibold transition-colors sm:text-xs',
                  activeSection === id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200/90 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-95" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ภาพรวมแบบเร็ว — จากออเดอร์จริง (Asia/Bangkok) */}
        {activeSection === 'overview' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              ภาพรวมแบบเร็ว
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
          <div className="rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 px-4 py-3 text-[0.7rem] text-gray-600">
            <div className="flex flex-wrap items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-sky-600" strokeWidth={2} />
              <span>
                ยอดขายตามปฏิทินไทย (Asia/Bangkok)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-sky-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-600">ยอดขายวันนี้</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                      {loading ? '…' : `฿${formatCurrency(overview?.quick?.sales_today ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-gray-500">
                      ออเดอร์ {loading ? '…' : (overview?.quick?.orders_today ?? 0)} รายการ
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                    <Wallet className="h-5 w-5 text-sky-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-indigo-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-600">ยอดขายสัปดาห์นี้</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                      {loading ? '…' : `฿${formatCurrency(overview?.quick?.sales_this_week ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-gray-500">
                      ออเดอร์ {loading ? '…' : (overview?.quick?.orders_this_week ?? 0)} รายการ (จันทร์–วันนี้)
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <Receipt className="h-5 w-5 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-violet-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-600">ยอดขายเดือนนี้ (ตั้งแต่ต้นเดือน)</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                      {loading ? '…' : `฿${formatCurrency(overview?.quick?.sales_this_month_mtd ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-gray-500">
                      ออเดอร์ {loading ? '…' : (overview?.quick?.orders_this_month_mtd ?? 0)} รายการ
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <PiggyBank className="h-5 w-5 text-violet-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-[0.65rem] text-gray-500">
            {overview?.comparison?.label ?? 'เทียบช่วงเดียวกันของเดือนก่อน (MTD)'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">รายได้รวม (เดือนนี้)</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? '…' : `฿${formatCurrency(overview?.revenue_mtd ?? 0)}`}
                </p>
                <div className="mt-2">
                  <GrowthBadge pct={overview?.comparison?.growth_pct?.revenue ?? null} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  จำนวนออเดอร์
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? '…' : (overview?.orders_mtd ?? 0)}
                </p>
                <div className="mt-2">
                  <GrowthBadge pct={overview?.comparison?.growth_pct?.orders ?? null} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  ลูกค้าใหม่
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? '…' : (overview?.new_customers_mtd ?? 0)}
                </p>
                <div className="mt-2">
                  <GrowthBadge pct={overview?.comparison?.growth_pct?.new_customers ?? null} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">ค่าใช้จ่ายรวม</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? '…' : `฿${formatCurrency(overview?.expenses_mtd ?? 0)}`}
                </p>
                <div className="mt-2">
                  <GrowthBadge pct={overview?.comparison?.growth_pct?.expenses ?? null} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">กำไรสุทธิ (โดยประมาณ)</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                  {loading ? '…' : `฿${formatCurrency(overview?.net_profit_mtd ?? 0)}`}
                </p>
                <div className="mt-2">
                  <GrowthBadge pct={overview?.comparison?.growth_pct?.net_profit ?? null} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {activeSection === 'sales' && (
        <>
        <div className="flex items-center gap-2 pt-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            ยอดขายและกราฟ
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ยอดขายรวม</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {loading ? '...' : `฿${formatCurrency(totals.total_revenue)}`}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    รวมจาก orders (ออเดอร์ที่ไม่ยกเลิก)
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    จำนวนชิ้นสินค้าที่ขายได้
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {loading ? '...' : totals.total_quantity.toLocaleString()}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    ผลรวมจำนวนชิ้นจากรายการสั่งซื้อ
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    จำนวนวันที่มีออเดอร์
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {loading ? '...' : totals.summary_days}
                  </p>
                  <p className="text-[0.7rem] text-gray-500 mt-1">
                    นับวันที่ต่างกันที่มีออเดอร์ (ปฏิทินไทย)
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-sky-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      กราฟยอดขาย
                    </p>
                    <p className="text-[0.7rem] text-gray-500">
                      รายได้รายวันจาก order_items (Asia/Bangkok) — เลือกปี/เดือนเพื่อโฟกัสช่วงเวลา มุมมองรายสัปดาห์/เดือน/ไตรมาสคำนวณจากข้อมูลรายวันในช่วงที่เลือก
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant={viewMode === 'day' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-[0.7rem]"
                      onClick={() => setViewMode('day')}
                    >
                      รายวัน
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'week' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-[0.7rem]"
                      onClick={() => setViewMode('week')}
                    >
                      รายสัปดาห์
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'month' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-[0.7rem]"
                      onClick={() => setViewMode('month')}
                    >
                      รายเดือน
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'quarter' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-[0.7rem]"
                      onClick={() => setViewMode('quarter')}
                    >
                      รายไตรมาส
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-100/90 bg-emerald-50/40 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[0.7rem] font-medium text-emerald-900">
                    <CalendarRange className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    ช่วงที่แสดง
                  </div>
                  <label className="flex items-center gap-1.5 text-[0.7rem] text-gray-700">
                    <span className="text-gray-500">ปี</span>
                    <select
                      className="h-8 min-w-[7.5rem] rounded-md border border-gray-200 bg-white px-2 text-[0.7rem] font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={chartFilterYear === 'all' ? 'all' : String(chartFilterYear)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === 'all') {
                          setChartFilterYear('all');
                          setChartFilterMonth('all');
                        } else {
                          setChartFilterYear(Number(v));
                        }
                      }}
                    >
                      <option value="all">ทุกปี (ข้อมูลทั้งหมด)</option>
                      {chartYearOptions.map((y) => (
                        <option key={y} value={y}>
                          พ.ศ. {y + 543} (ค.ศ. {y})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    className={cn(
                      'flex items-center gap-1.5 text-[0.7rem]',
                      chartFilterYear === 'all' ? 'text-gray-400' : 'text-gray-700'
                    )}
                  >
                    <span className={chartFilterYear === 'all' ? 'text-gray-400' : 'text-gray-500'}>เดือน</span>
                    <select
                      className="h-8 min-w-[6.5rem] rounded-md border border-gray-200 bg-white px-2 text-[0.7rem] font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={chartFilterYear === 'all'}
                      value={chartFilterMonth === 'all' ? 'all' : String(chartFilterMonth)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChartFilterMonth(v === 'all' ? 'all' : Number(v));
                      }}
                    >
                      {CHART_MONTH_OPTIONS.map((m) => (
                        <option
                          key={m.value === 'all' ? 'all' : m.value}
                          value={m.value === 'all' ? 'all' : String(m.value)}
                        >
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {chartFilterYear !== 'all' && (
                    <span className="text-[0.65rem] text-emerald-800/90">
                      {chartFilterMonth === 'all'
                        ? `ทุกเดือนในปี พ.ศ. ${chartFilterYear + 543}`
                        : `เฉพาะ ${CHART_MONTH_OPTIONS.find((x) => x.value === chartFilterMonth)?.label ?? ''} พ.ศ. ${chartFilterYear + 543}`}
                    </span>
                  )}
                </div>
              </div>

              {loading ? (
                <p className="text-xs text-gray-500">กำลังโหลดข้อมูล...</p>
              ) : chartData.length === 0 ? (
                <p className="text-xs text-gray-500">
                  {daily.length === 0
                    ? 'ยังไม่มีข้อมูลออเดอร์ในฐานข้อมูล'
                    : 'ไม่มีข้อมูลในช่วงปี/เดือนที่เลือก — ลองเปลี่ยนตัวกรองหรือเลือก “ทุกปี”'}
                </p>
              ) : (
                <div className="mt-2 h-64 border border-dashed border-gray-200 rounded-lg px-3 py-3 bg-gradient-to-b from-white to-emerald-50/40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey={viewMode === 'day' ? 'dateLabel' : 'label'}
                        tick={{ fontSize: 10, fill: '#4b5563' }}
                        interval={viewMode === 'day' ? 'preserveStartEnd' : 0}
                        minTickGap={viewMode === 'day' ? 6 : undefined}
                        height={32}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <Tooltip
                        formatter={(value) =>
                          [`฿${formatCurrency(Number(value ?? 0))}`, 'ยอดขาย']
                        }
                        labelFormatter={(label) => {
                          const text = String(label ?? '');
                          if (viewMode === 'day') return `วันที่ ${text}`;
                          if (viewMode === 'week') return text;
                          if (viewMode === 'month') return `เดือน ${text}`;
                          return text;
                        }}
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 8,
                          borderColor: '#e5e7eb',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
        )}

        {/* กราฟเชิงลึกและการแจ้งเตือน */}
        {activeSection === 'charts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-800/90">
              กราฟเชิงลึกและการแจ้งเตือน
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
          </div>
          <p className="text-sm text-gray-600">
            ยอดขายรายวัน (90 วันล่าสุด) และรายเดือนจากฐานข้อมูล แนวโน้มกำไรรายวัน เทียบหมวดหมู่ และรายการแจ้งเตือนอัตโนมัติ
          </p>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-violet-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">ยอดขายรายวัน</p>
                  <p className="text-[0.7rem] text-gray-500">90 วันล่าสุด — Asia/Bangkok</p>
                </div>
                {loading || dailyRevenueLast90.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-500">
                    {loading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูล'}
                  </p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dailyRevenueLast90}
                        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="dailyRev90" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.08} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fontSize: 9, fill: '#6b7280' }}
                          interval="preserveStartEnd"
                          minTickGap={8}
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <Tooltip
                          formatter={(value) => [`฿${formatCurrency(Number(value ?? 0))}`, 'ยอดขาย']}
                          labelFormatter={(l) => `วันที่ ${l}`}
                          contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total_revenue"
                          stroke="#6d28d9"
                          strokeWidth={2}
                          fill="url(#dailyRev90)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">ยอดขายรายเดือน</p>
                  <p className="text-[0.7rem] text-gray-500">สูงสุด 24 เดือน — รวมจาก order_items</p>
                </div>
                {loading || monthlyFromApi.length === 0 ? (
                  <p className="py-8 text-center text-xs text-gray-500">
                    {loading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูล'}
                  </p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyFromApi} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: '#6b7280' }}
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={56}
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                        />
                        <Tooltip
                          formatter={(value) => [`฿${formatCurrency(Number(value ?? 0))}`, 'ยอดขาย']}
                          labelFormatter={(l) => String(l)}
                          contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        />
                        <Bar dataKey="total_revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-sky-100/80 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">แนวโน้มกำไรขั้นต้น (รายวัน)</p>
                  <p className="text-[0.7rem] text-gray-500">รายได้บรรทัด − COGS ต่อวัน</p>
                </div>
              </div>
              {loading || dailyProfitLine.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-500">
                  {loading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูล'}
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyProfitLine} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 9, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                        minTickGap={10}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                      />
                      <Tooltip
                        formatter={(value) => [`฿${formatCurrency(Number(value ?? 0))}`, 'กำไร']}
                        labelFormatter={(l) => `วันที่ ${l}`}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="gross_profit"
                        name="กำไรขั้นต้น"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-100/80 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900">เทียบหมวดหมู่ (รายได้ vs กำไร)</p>
                <p className="text-[0.7rem] text-gray-500">สูงสุด 10 หมวดจากยอดขายรวม</p>
              </div>
              {loading || categoryCompare.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-500">
                  {loading ? 'กำลังโหลด…' : 'ยังไม่มีข้อมูลหมวด'}
                </p>
              ) : (
                <div className="h-[420px] max-h-[70vh] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={categoryCompare}
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={108}
                        tick={{ fontSize: 10, fill: '#374151' }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const n = String(name ?? '');
                          const label =
                            n === 'revenue' || n === 'รายได้'
                              ? 'รายได้'
                              : n === 'gross_profit' || n === 'กำไรขั้นต้น'
                                ? 'กำไรขั้นต้น'
                                : n;
                          return [`฿${formatCurrency(Number(value ?? 0))}`, label];
                        }}
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                          return row?.fullName ? String(row.fullName) : '';
                        }}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="รายได้" fill="#059669" barSize={12} radius={[0, 2, 2, 0]} />
                      <Bar dataKey="gross_profit" name="กำไรขั้นต้น" fill="#6ee7b7" barSize={12} radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-amber-100/90 bg-amber-50/30 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-gray-900">ขายดีเกินคาด</p>
                </div>
                <p className="mb-3 text-[0.7rem] leading-relaxed text-gray-600">
                  เกณฑ์คัดกรอง : ยอด 30 วันล่าสุด ≥ (ยอด 30 วันก่อนหน้า × {surpriseFactor}) + ฿
                  {surpriseBump} และยอดก่อนหน้า ≥ ฿{surpriseMinPrev}
                </p>
                {!salesSurprise.length ? (
                  <p className="text-xs text-gray-500">ไม่มีรายการในขณะนี้</p>
                ) : (
                  <ul className="space-y-2 text-[0.75rem]">
                    {salesSurprise.map((a) => {
                      const isExpanded = expandedSalesSurprise.has(a.product_id);
                      const threshold = a.revenue_prev_30d * surpriseFactor + surpriseBump;
                      return (
                        <li
                          key={a.product_id}
                          className={cn(
                            'overflow-hidden rounded-xl border bg-white shadow-sm transition-colors',
                            isExpanded ? 'border-amber-200/80' : 'border-amber-100/70 hover:border-amber-200/80'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSalesSurprise(a.product_id)}
                            className={cn(
                              'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left',
                              'bg-gradient-to-r from-amber-50/60 via-white to-white',
                              'hover:from-amber-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60'
                            )}
                            aria-expanded={isExpanded}
                            aria-controls={`sales-surprise-${a.product_id}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="whitespace-normal break-words text-[0.8rem] font-normal leading-snug text-gray-900">
                                {a.product_name_th}
                              </p>
                              {a.growth_pct != null && (
                                <p className="mt-0.5 text-[0.68rem] font-normal text-amber-800/80">
                                  โต {a.growth_pct}%
                                </p>
                              )}
                            </div>
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 ring-1 ring-amber-200/70">
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 text-amber-800 transition-transform',
                                  isExpanded ? 'rotate-180' : 'rotate-0'
                                )}
                                aria-hidden="true"
                              />
                            </span>
                          </button>

                          {isExpanded && (
                            <div id={`sales-surprise-${a.product_id}`} className="space-y-2 px-3 pb-3">
                              <div className="rounded-lg border border-amber-100/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 px-3 py-2.5">
                                <div className="flex flex-wrap items-end gap-2 tabular-nums">
                                  <span className="text-[0.65rem] font-normal text-amber-900/80">30 วันล่าสุด</span>
                                  <span className="text-[0.95rem] font-normal text-amber-950">
                                    ฿{formatCurrency(a.revenue_30d)}
                                  </span>
                                  <span className="text-[0.7rem] text-gray-400">•</span>
                                  <span className="text-[0.65rem] font-normal text-gray-700/80">ก่อนหน้า</span>
                                  <span className="text-[0.9rem] font-normal text-gray-900">
                                    ฿{formatCurrency(a.revenue_prev_30d)}
                                  </span>
                                  {a.growth_pct != null && (
                                    <>
                                      <span className="text-[0.7rem] text-gray-400">•</span>
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-normal text-emerald-700 ring-1 ring-emerald-200/80">
                                        +{a.growth_pct}%
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="rounded-lg border border-amber-100/80 bg-white px-3 py-2.5">
                                <p className="text-[0.7rem] font-normal text-amber-900/90">
                                  เกณฑ์ขั้นต่ำ (แยกส่วน)
                                </p>
                                <div className="mt-2 grid grid-cols-2 items-end gap-2 text-[0.75rem] tabular-nums sm:grid-cols-4">
                                  <div className="rounded-lg bg-amber-50/60 px-2.5 py-2 ring-1 ring-amber-200/50">
                                    <div className="text-[0.62rem] font-normal text-amber-800/80">ก่อนหน้า</div>
                                    <div className="mt-0.5 font-normal text-gray-900">
                                      ฿{formatCurrency(a.revenue_prev_30d)}
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-amber-50/60 px-2.5 py-2 ring-1 ring-amber-200/50">
                                    <div className="text-[0.62rem] font-normal text-amber-800/80">× ตัวคูณ</div>
                                    <div className="mt-0.5 font-normal text-gray-900">{surpriseFactor}</div>
                                  </div>
                                  <div className="rounded-lg bg-amber-50/60 px-2.5 py-2 ring-1 ring-amber-200/50">
                                    <div className="text-[0.62rem] font-normal text-amber-800/80">+ ค่าคงที่</div>
                                    <div className="mt-0.5 font-normal text-gray-900">
                                      ฿{formatCurrency(surpriseBump)}
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-amber-100/70 px-2.5 py-2 ring-1 ring-amber-200/70">
                                    <div className="text-[0.62rem] font-normal text-amber-900/80">= เกณฑ์ขั้นต่ำ</div>
                                    <div className="mt-0.5 text-[0.8rem] font-normal text-amber-950">
                                      ฿{formatCurrency(threshold)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-rose-100/90 bg-rose-50/25 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <p className="text-sm font-semibold text-gray-900">กำไรต่ำกว่าเกณฑ์</p>
                </div>
                <p className="mb-3 text-[0.7rem] leading-relaxed text-gray-600">
                  มาร์จิ้นขั้นต้น &lt; {alerts?.rules?.low_margin_pct ?? 12}% และรายได้รวมสินค้า &gt; ฿
                  {formatCurrency(alerts?.rules?.min_revenue_for_low_margin_alert ?? 1500)}
                </p>
                {!alerts?.low_margin?.length ? (
                  <p className="text-xs text-gray-500">ไม่มีรายการในขณะนี้</p>
                ) : (
                  <ul className="space-y-2 text-[0.75rem]">
                    {alerts.low_margin.map((a) => (
                      <li
                        key={a.product_id}
                        className="rounded-md border border-rose-200/80 bg-white/80 px-2.5 py-2"
                      >
                        <p className="font-medium text-gray-900">{a.product_name_th}</p>
                        <p className="mt-0.5 tabular-nums text-gray-600">
                          มาร์จิ้น {a.margin_pct.toFixed(1)}% · รายได้ ฿{formatCurrency(a.revenue)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/40 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-slate-600" />
                  <p className="text-sm font-semibold text-gray-900">สินค้าไม่เคลื่อนไหว</p>
                </div>
                <p className="mb-3 text-[0.7rem] leading-relaxed text-gray-600">
                  คงคลัง ≥ {alerts?.rules?.stagnant_min_stock ?? 8} ชิ้น แต่ไม่มียอดขายใน{' '}
                  {alerts?.rules?.stagnant_days ?? 90} วัน (ต่อ variant)
                </p>
                {!alerts?.stagnant?.length ? (
                  <p className="text-xs text-gray-500">ไม่มีรายการในขณะนี้</p>
                ) : (
                  <ul className="space-y-2 text-[0.75rem]">
                    {alerts.stagnant.map((a) => (
                      <li
                        key={a.variant_id}
                        className="rounded-md border border-slate-200 bg-white/90 px-2.5 py-2"
                      >
                        <p className="font-medium text-gray-900">{a.product_name_th}</p>
                        <p className="mt-0.5 text-gray-600">
                          {a.variant_sku ? `SKU ${a.variant_sku} · ` : ''}คงคลัง {a.available_quantity} · ขาย 90 วัน{' '}
                          {a.sold_90d}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* รายได้และกำไรเชิงลึก */}
        {activeSection === 'profit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90">
              รายได้และกำไรเชิงลึก
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
          </div>
          <p className="text-sm text-gray-600">
            วัดจากรายการสั่งซื้อจริง — รายได้คือยอดขายตามบรรทัด ต้นทุนจากต้นทุนต่อหน่วยของ variant ช่วยเห็นว่า “ขายเยอะแต่กำไรน้อย” หรือไม่
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-emerald-100/80 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">รายได้รวม</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                      {loading ? '…' : `฿${formatCurrency(profit?.summary.line_revenue ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-gray-500">สอดคล้องกับต้นทุน/กำไรด้านล่าง</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">ต้นทุนสินค้า (COGS)</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                      {loading ? '…' : `฿${formatCurrency(profit?.summary.cogs ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-gray-500">Σ(จำนวน × ต้นทุนต่อหน่วย)</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Receipt className="h-5 w-5 text-slate-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-sky-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">กำไรขั้นต้น</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-sky-900">
                      {loading ? '…' : `฿${formatCurrency(profit?.summary.gross_profit ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-gray-500">
                      มาร์จิ้น{' '}
                      {loading ? '…' : `${(profit?.summary.gross_margin_pct ?? 0).toFixed(1)}%`}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                    <TrendingUp className="h-5 w-5 text-sky-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-violet-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">กำไรสุทธิ (โดยประมาณ)</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-violet-900">
                      {loading ? '…' : `฿${formatCurrency(profit?.summary.net_profit ?? 0)}`}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-gray-500">
                      มาร์จิ้น{' '}
                      {loading ? '…' : `${(profit?.summary.net_margin_pct ?? 0).toFixed(1)}%`}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <Coins className="h-5 w-5 text-violet-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-[0.7rem] leading-relaxed text-amber-950/90">
            {profit?.summary.note ??
              'กำไรสุทธิเท่ากับกำไรขั้นต้น — ระบบยังไม่หักค่าใช้จ่ายดำเนินงานอื่น'}
          </p>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">กำไรแยกตามสินค้า</p>
                    <p className="text-[0.7rem] text-gray-500">เรียงตามกำไรขั้นต้น — สูงสุด 15 รายการ</p>
                  </div>
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <div className="max-h-[420px] overflow-x-auto overflow-y-auto px-1 pb-2">
                  {loading ? (
                    <p className="px-4 py-6 text-xs text-gray-500">กำลังโหลด…</p>
                  ) : !profit?.by_product?.length ? (
                    <p className="px-4 py-6 text-xs text-gray-500">ยังไม่มีข้อมูล</p>
                  ) : (
                    <Table>
                      <THead>
                        <TR className="border-b border-gray-200 bg-white hover:bg-white">
                          <TH className="whitespace-nowrap py-2 pl-3 pr-2 text-left text-[0.65rem] font-semibold uppercase text-gray-600">
                            สินค้า
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            รายได้
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            ต้นทุน
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            กำไร
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            %
                          </TH>
                        </TR>
                      </THead>
                      <TBody>
                        {profit.by_product.map((row) => (
                          <TR key={row.product_id} className="border-b border-gray-50 hover:bg-emerald-50/30">
                            <TD className="max-w-[200px] py-2 pl-3 pr-2 align-top text-[0.75rem] font-medium text-gray-900">
                              <span className="line-clamp-2">{row.product_name_th}</span>
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-800">
                              ฿{formatCurrency(row.revenue)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-600">
                              ฿{formatCurrency(row.cogs)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] font-semibold tabular-nums text-emerald-800">
                              ฿{formatCurrency(row.gross_profit)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-700">
                              {row.margin_pct.toFixed(1)}%
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">กำไรแยกตามหมวดหมู่</p>
                    <p className="text-[0.7rem] text-gray-500">จาก categories / subcategories ของสินค้า</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="max-h-[420px] overflow-x-auto overflow-y-auto px-1 pb-2">
                  {loading ? (
                    <p className="px-4 py-6 text-xs text-gray-500">กำลังโหลด…</p>
                  ) : !profit?.by_category?.length ? (
                    <p className="px-4 py-6 text-xs text-gray-500">ยังไม่มีข้อมูล</p>
                  ) : (
                    <Table>
                      <THead>
                        <TR className="border-b border-gray-200 bg-white hover:bg-white">
                          <TH className="whitespace-nowrap py-2 pl-3 pr-2 text-left text-[0.65rem] font-semibold uppercase text-gray-600">
                            หมวดหมู่
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            รายได้
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            ต้นทุน
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            กำไร
                          </TH>
                          <TH className="whitespace-nowrap py-2 px-2 text-right text-[0.65rem] font-semibold uppercase text-gray-600">
                            %
                          </TH>
                        </TR>
                      </THead>
                      <TBody>
                        {profit.by_category.map((row) => (
                          <TR
                            key={`${row.category_id}-${row.category_name_th}`}
                            className="border-b border-gray-50 hover:bg-emerald-50/30"
                          >
                            <TD className="py-2 pl-3 pr-2 align-top text-[0.75rem] font-medium text-gray-900">
                              {row.category_name_th}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-800">
                              ฿{formatCurrency(row.revenue)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-600">
                              ฿{formatCurrency(row.cogs)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] font-semibold tabular-nums text-emerald-800">
                              ฿{formatCurrency(row.gross_profit)}
                            </TD>
                            <TD className="whitespace-nowrap py-2 px-2 text-right text-[0.75rem] tabular-nums text-gray-700">
                              {row.margin_pct.toFixed(1)}%
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* บริหารสต็อก */}
        {activeSection === 'stock' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/90">
              บริหารสต็อก
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
          </div>
          <p className="text-sm text-gray-600">
            สรุปจากฐานข้อมูล (ออเดอร์ + สต็อกคลัง) — ใช้ประกอบการเติมของและลดสินค้าค้างขาย
          </p>
          <p className="rounded-md border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-[0.75rem] text-amber-950">
            ด้านล่าง: <strong>กล่องสีเขียวอมฟ้า</strong> = ข้อมูลเฉพาะเดือนปฏิทินปัจจุบัน ·{' '}
            <strong>การ์ดสีขาวด้านล่าง</strong> = สะสมทุกช่วงเวลา
          </p>

          <Card className="border-amber-100 bg-gradient-to-r from-amber-50/50 to-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Package className="h-6 w-6 text-amber-800" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">จำนวนสินค้าคงเหลือ (รวมทุกคลัง)</p>
                    <p className="text-[0.7rem] text-gray-500">
                      ผลรวม available quantity จาก inventories
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold tabular-nums text-gray-900">
                  {loading ? '…' : (inv?.total_available_units ?? 0).toLocaleString('th-TH')}
                  <span className="ml-1.5 text-base font-semibold text-gray-500">ชิ้น</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 py-2 text-[0.75rem] text-teal-950">
            <strong>เดือนนี้ ({thisMonthLeaders?.label_th ?? '—'})</strong>
            {' — '}
            อันดับสินค้าและหมวดหมู่ด้านล่างนับเฉพาะออเดอร์ที่วันที่อยู่ในเดือนปฏิทินปัจจุบัน (Asia/Bangkok)
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-teal-200 shadow-sm ring-1 ring-teal-100">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">สินค้าขายดีที่สุดในเดือนนี้ Top 5</p>
                    <p className="text-[0.7rem] text-gray-500">เรียงตามจำนวนชิ้นในเดือน (order_items)</p>
                  </div>
                  <Trophy className="h-5 w-5 shrink-0 text-teal-600" />
                </div>
                {loading ? (
                  <p className="text-xs text-gray-500">กำลังโหลด…</p>
                ) : !thisMonthLeaders?.top_products?.length ? (
                  <p className="text-xs text-gray-500">ยังไม่มียอดขายในเดือนนี้</p>
                ) : (
                  <ul className="space-y-2">
                    {thisMonthLeaders.top_products.map((p, index) => (
                      <li
                        key={`tm-qty-${p.product_id}-${index}`}
                        className="flex items-center justify-between rounded-md border border-teal-100 bg-white/90 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-[0.7rem] font-semibold text-gray-500">
                            {index + 1}.
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-900">{p.product_name_th}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold tabular-nums text-gray-900">
                            {p.total_quantity.toLocaleString()} ชิ้น
                          </p>
                          <p className="text-[0.65rem] text-emerald-700">฿{formatCurrency(p.total_revenue)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-teal-200 shadow-sm ring-1 ring-teal-100">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">ประเภทสินค้า (หมวด) ขายดีในเดือนนี้ Top 5</p>
                    <p className="text-[0.7rem] text-gray-500">เรียงตามยอดรายได้รวมในเดือน</p>
                  </div>
                  <Layers className="h-5 w-5 shrink-0 text-teal-600" />
                </div>
                {loading ? (
                  <p className="text-xs text-gray-500">กำลังโหลด…</p>
                ) : !thisMonthLeaders?.top_categories?.length ? (
                  <p className="text-xs text-gray-500">ยังไม่มียอดขายในเดือนนี้</p>
                ) : (
                  <ul className="space-y-2">
                    {thisMonthLeaders.top_categories.map((c, index) => (
                      <li
                        key={`tm-cat-${c.category_id}-${c.category_name_th}-${index}`}
                        className="flex items-center justify-between rounded-md border border-teal-100 bg-white/90 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-[0.7rem] font-semibold text-gray-500">
                            {index + 1}.
                          </span>
                          <p className="truncate text-xs font-medium text-gray-900">{c.category_name_th}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-emerald-700">฿{formatCurrency(c.total_revenue)}</p>
                          <p className="text-[0.65rem] text-gray-500">{c.total_quantity.toLocaleString()} ชิ้น</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800/90">
              สะสมทุกช่วงเวลา (ทั้งประวัติ)
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">สินค้าขายดีที่สุด Top 5 (สะสม)</p>
                    <p className="text-[0.7rem] text-gray-500">เรียงตามจำนวนชิ้นทั้งหมด (order_items)</p>
                  </div>
                  <Trophy className="h-5 w-5 shrink-0 text-amber-600" />
                </div>
                {loading ? (
                  <p className="text-xs text-gray-500">กำลังโหลด…</p>
                ) : topProducts.length === 0 ? (
                  <p className="text-xs text-gray-500">ยังไม่มีข้อมูล</p>
                ) : (
                  <ul className="space-y-2">
                    {topProducts.map((p, index) => (
                      <li
                        key={`qty-${p.product_id}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/80 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-[0.7rem] font-semibold text-gray-500">
                            {index + 1}.
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-900">{p.product_name_th}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold tabular-nums text-gray-900">
                            {p.total_quantity.toLocaleString()} ชิ้น
                          </p>
                          <p className="text-[0.65rem] text-emerald-700">฿{formatCurrency(p.total_revenue)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">สินค้าที่ทำรายได้สูงสุด Top 5 (สะสม)</p>
                    <p className="text-[0.7rem] text-gray-500">เรียงตามยอดรายได้รวมทั้งหมด (order_items)</p>
                  </div>
                  <DollarSign className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
                {loading ? (
                  <p className="text-xs text-gray-500">กำลังโหลด…</p>
                ) : topByRevenue.length === 0 ? (
                  <p className="text-xs text-gray-500">ยังไม่มีข้อมูล</p>
                ) : (
                  <ul className="space-y-2">
                    {topByRevenue.map((p, index) => (
                      <li
                        key={`rev-${p.product_id}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/80 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-[0.7rem] font-semibold text-gray-500">
                            {index + 1}.
                          </span>
                          <p className="truncate text-xs font-medium text-gray-900">{p.product_name_th}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-emerald-700">฿{formatCurrency(p.total_revenue)}</p>
                          <p className="text-[0.65rem] text-gray-500">{p.total_quantity.toLocaleString()} ชิ้น</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">สินค้าที่กำไรดีที่สุด Top 5 (สะสม)</p>
                    <p className="text-[0.7rem] text-gray-500">
                      กำไรจากออเดอร์จริง (ทั้งประวัติ): Σ(ราคาขาย − ต้นทุน) × จำนวน
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 shrink-0 text-sky-600" />
                </div>
                {loading ? (
                  <p className="text-xs text-gray-500">กำลังโหลด…</p>
                ) : topByProfit.length === 0 ? (
                  <p className="text-xs text-gray-500">ยังไม่มีข้อมูลหรือยังไม่ได้กรอกต้นทุน</p>
                ) : (
                  <ul className="space-y-2">
                    {topByProfit.map((p, index) => (
                      <li
                        key={`prf-${p.product_id}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/80 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-[0.7rem] font-semibold text-gray-500">
                            {index + 1}.
                          </span>
                          <p className="truncate text-xs font-medium text-gray-900">{p.product_name_th}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-sky-800">฿{formatCurrency(p.total_profit)}</p>
                          <p className="text-[0.65rem] text-gray-500">รายได้ ฿{formatCurrency(p.total_revenue)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {activeSection === 'methodology' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                ขั้นตอนการคำนวณ
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>
            <p className="text-sm text-gray-600">
              สรุปจากโค้ด API และหน้านี้ — ใช้เข้าใจว่าตัวเลขแต่ละจุดมาจากไหนและคำนวณอย่างไร
            </p>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-3 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Calculator className="h-4 w-4 text-slate-600" strokeWidth={2} />
                  หลักร่วมทั้งระบบ
                </div>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    เขตเวลาอ้างอิง: <strong>Asia/Bangkok</strong> — วันที่ของออเดอร์ใช้{' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">timezone(&apos;Asia/Bangkok&apos;, orderdate)</code>{' '}
                    แล้วตัดเป็นวันที่
                  </li>
                  <li>
                    นับเฉพาะออเดอร์ที่ <strong>orderstatus ≠ cancelled</strong>
                  </li>
                  <li>
                    ต้นทุนต่อชิ้นมาจาก <strong>productvariants.cost</strong> คูณกับจำนวนในรายการ (
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">quantityordered × cost</code>)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-sky-100 shadow-sm">
              <CardContent className="space-y-2 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <p className="text-sm font-semibold text-gray-900">1. ภาพรวมแบบเร็ว</p>
                <p className="text-[0.75rem] text-gray-500">แหล่งข้อมูล: GET /api/dashboard-overview</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>ยอดขายวันนี้ / สัปดาห์นี้ / เดือนนี้ (MTD)</strong> — รวม{' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">orders.totalamount</code> ตามช่วงวันที่ใน Bangkok
                    (สัปดาห์เริ่มตาม <code className="rounded bg-slate-100 px-1">date_trunc(&apos;week&apos;)</code> ของเซิร์ฟเวอร์)
                  </li>
                  <li>
                    <strong>ค่าใช้จ่ายรวม (COGS) ในการ์ด MTD</strong> —{' '}
                    Σ(จำนวน × ต้นทุน variant) ของรายการสั่งซื้อในช่วง MTD เดียวกัน
                  </li>
                  <li>
                    <strong>กำไรสุทธิ (โดยประมาณ)</strong> — รายได้ MTD − COGS MTD (ยังไม่หักค่าใช้จ่ายอื่นของร้าน)
                  </li>
                  <li>
                    <strong>ลูกค้าใหม่</strong> — นับจากวันที่ลงทะเบียนใน Bangkok ในช่วงที่กำหนด
                  </li>
                  <li>
                    <strong>เปอร์เซ็นต์โต้</strong> — เปรียบเทียบ MTD ปัจจุบันกับช่วง MTD เทียบเท่าของเดือนก่อน (จำนวนวันเท่ากัน)
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 shadow-sm">
              <CardContent className="space-y-2 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <p className="text-sm font-semibold text-gray-900">2. การ์ดยอดรวมและกราฟหลัก</p>
                <p className="text-[0.75rem] text-gray-500">แหล่งข้อมูล: GET /api/sales-summary — ส่วนที่เหลือประมวลผลบนหน้าเว็บ</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>ยอดขายรวม</strong>
                  </li>
                  <li>
                    <strong>จำนวนชิ้นที่ขายได้</strong> —{' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">SUM(order_items.quantityordered)</code>
                  </li>
                  <li>
                    <strong>จำนวนวันที่มีออเดอร์</strong> — จำนวนวันที่ต่างกัน (นับจากวันที่ออเดอร์ Bangkok)
                  </li>
                  <li>
                    <strong>กราฟรายวัน</strong> — รวม{' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">order_items.totalprice</code> ตามวันที่
                  </li>
                  <li>
                    <strong>รายสัปดาห์ / เดือน / ไตรมาส</strong> — รวมยอดจากชุดรายวันที่ผ่านการกรองปี–เดือน (ถ้ามี) แล้วจัดกลุ่มตามปฏิทิน
                  </li>
                  <li>
                    <strong>ตัวกรองปี/เดือน</strong> — กรองชุดรายวันในฝั่งเบราว์เซอร์ ไม่เรียก API ซ้ำ
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-violet-100 shadow-sm">
              <CardContent className="space-y-2 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <p className="text-sm font-semibold text-gray-900">3. กราฟเชิงลึกและการแจ้งเตือน</p>
                <p className="text-[0.75rem] text-gray-500">แหล่งข้อมูล: GET /api/sales-summary (charts, alerts)</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>ยอดขายรายวัน (90 วัน)</strong> — ตัด 90 วันล่าสุดจากชุดรายวัน (หลังเรียงวันที่)
                  </li>
                  <li>
                    <strong>ยอดขายรายเดือน</strong> — รวมตามเดือนปฏิทิน Bangkok สูงสุด 24 เดือน
                  </li>
                  <li>
                    <strong>แนวโน้มกำไรรายวัน</strong> — ต่อวัน: รายได้บรรทัด − COGS บรรทัด (Σ totalprice − Σ qty×cost)
                  </li>
                  <li>
                    <strong>เทียบหมวดหมู่</strong> — จัดกลุ่มตาม categories ผ่าน subcategories ของสินค้า
                  </li>
                  <li>
                    <strong>ขายดีเกินคาด</strong> — ยอด 30 วันล่าสุด ≥ 1.35× ยอด 30 วันก่อนหน้า + 200 และยอดก่อนหน้า ≥ 150 บาท
                  </li>
                  <li>
                    <strong>กำไรต่ำกว่าเกณฑ์</strong> — สินค้าที่รายได้รวม &gt; 1,500 และมาร์จิ้นขั้นต้น &lt; 12%
                  </li>
                  <li>
                    <strong>สินค้าไม่เคลื่อนไหว</strong> — variant ที่คงคลัง ≥ 8 แต่ไม่มียอดขายใน 90 วัน
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/80 shadow-sm">
              <CardContent className="space-y-2 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <p className="text-sm font-semibold text-gray-900">4. รายได้และกำไรเชิงลึก</p>
                <p className="text-[0.75rem] text-gray-500">แหล่งข้อมูล: profitDeepDive ใน GET /api/sales-summary</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>รายได้ / COGS / กำไร</strong> — คำนวณจากบรรทัด order_items เท่านั้น: รายได้ ={' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">SUM(totalprice)</code>, COGS ={' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">SUM(quantityordered × cost)</code>
                  </li>
                  <li>
                    <strong>มาร์จิ้น %</strong> — (กำไรขั้นต้น ÷ รายได้) × 100 (ปัดทศนิยมตาม API)
                  </li>
                  <li>
                    <strong>กำไร Top 5 ในแท็บสต็อก</strong> — ใช้สูตร Σ((unitprice − cost) × จำนวน) ต่อสินค้า (อาจไม่ตรงทุกกรณีกับผลต่างรายได้−COGS ถ้ามีส่วนลดพิเศษในบรรทัด)
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-amber-100 shadow-sm">
              <CardContent className="space-y-2 p-4 text-[0.8rem] leading-relaxed text-gray-700">
                <p className="text-sm font-semibold text-gray-900">5. บริหารสต็อก</p>
                <p className="text-[0.75rem] text-gray-500">แหล่งข้อมูล: GET /api/sales-summary</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>จำนวนคงคลังรวม</strong> —{' '}
                    <code className="rounded bg-slate-100 px-1 text-[0.75rem]">SUM(inventories.availablequantity)</code> ทุกแถว
                  </li>
                  <li>
                    <strong>Top 5 ตามจำนวนชิ้น / รายได้</strong> — รวม order_items แล้วจัดกลุ่มตามสินค้า
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

