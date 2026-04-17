import { NextRequest, NextResponse } from 'next/server';
import { updateBranch, deleteBranch, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  try {
    updateBranch(Number(id), data);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  deleteBranch(Number(id));
  return NextResponse.json({ ok: true });
}
