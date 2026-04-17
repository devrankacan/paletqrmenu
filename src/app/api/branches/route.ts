import { NextRequest, NextResponse } from 'next/server';
import { getBranches, createBranch, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  return NextResponse.json(getBranches());
}

export async function POST(req: NextRequest) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, slug, address, phone, working_hours, wifi_password } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: 'name ve slug zorunludur' }, { status: 400 });

  try {
    const id = createBranch({ name, slug, address, phone, working_hours, wifi_password });
    return NextResponse.json({ id, ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
