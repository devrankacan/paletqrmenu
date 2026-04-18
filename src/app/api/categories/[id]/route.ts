import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ['name', 'icon', 'sort_order', 'cover_url'];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  try {
    updateCategory(Number(id), data);
  } catch (err) {
    console.error('updateCategory error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
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
