import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { parseLimitOffset } from '@/lib/pagination';
import { query } from '@/database/connection';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const { limit, offset } = parseLimitOffset(
      searchParams.get('limit'),
      searchParams.get('offset'),
      { maxLimit: 500, defaultLimit: 100, defaultOffset: 0 }
    );
    const source = searchParams.get('source') || undefined;

    let sql = `
      SELECT logid, source, resourcetype, resourceid, errormessage, httpstatus, createdat
      FROM fetchlogs
    `;
    const params: unknown[] = [];
    if (source) {
      params.push(source);
      sql += ` WHERE source = $${params.length}`;
    }
    sql += ` ORDER BY createdat DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const items = result.rows.map((row) => ({
      id: row.logid,
      source: row.source,
      resourceType: row.resourcetype,
      resourceId: row.resourceid,
      errorMessage: row.errormessage,
      httpStatus: row.httpstatus,
      createdAt: row.createdat,
    }));

    const countRes = source
      ? await query('SELECT COUNT(1) AS total FROM fetchlogs WHERE source = $1', [source])
      : await query('SELECT COUNT(1) AS total FROM fetchlogs');
    const total = parseInt(countRes.rows[0]?.total as string, 10) || 0;

    return NextResponse.json({ ok: true, items, total });
  } catch (error) {
    console.error('Fetch logs API error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
