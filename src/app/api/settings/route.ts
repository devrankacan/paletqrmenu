import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSetting, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  return NextResponse.json(getSettings());
}

export async function PATCH(req: NextRequest) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    updateSetting(key, String(value));
  }
  return NextResponse.json({ ok: true });
}
