import { NextRequest, NextResponse } from 'next/server';
import { forbidStaffApi } from '@/lib/staff-api-guard';

type PromotionEngineItem = {
  variant_id: number;
  product_id: number;
  product_name: string;
  strategy: string;
  priority: number;
  discount_percent: number;
  original_price: number;
  final_price: number;
  lift_score?: number;
};

type PromotionEngineResponse = {
  total_promotions: number;
  promotions: PromotionEngineItem[];
};

const DEFAULT_ENGINE_URL = 'https://api.pjaichat.xyz/promotion-engine';

export async function GET(req: NextRequest) {
  try {
    const denied = await forbidStaffApi();
    if (denied) return denied;

    const baseUrl = process.env.PROMOTION_ENGINE_URL || DEFAULT_ENGINE_URL;
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const strategy = searchParams.get('strategy');

    const upstreamUrl = new URL(baseUrl);
    if (limitParam) upstreamUrl.searchParams.set('limit', limitParam);
    if (strategy) upstreamUrl.searchParams.set('strategy', strategy);

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => '');
      return NextResponse.json(
        { ok: false, error: `Promotion engine error (${upstreamRes.status})`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = (await upstreamRes.json()) as PromotionEngineResponse;
    return NextResponse.json({ ok: true, ...data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

