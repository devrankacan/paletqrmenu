import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  updateCategory(Number(id), data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  deleteCategory(Number(id));
  return NextResponse.json({ ok: true });
}
