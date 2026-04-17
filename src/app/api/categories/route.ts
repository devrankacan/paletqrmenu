import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getCategoriesByBranch, createCategory, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function slugify(str: string) {
  return str.toLowerCase()
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET(req: NextRequest) {
  initDb();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branch_id');
  if (branchId) return NextResponse.json(getCategoriesByBranch(Number(branchId)));
  return NextResponse.json(getCategories());
}

export async function POST(req: NextRequest) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { branch_id, name, icon, sort_order } = await req.json();
  if (!branch_id || !name) return NextResponse.json({ error: 'branch_id ve name zorunludur' }, { status: 400 });

  const slug = `${slugify(name)}-${branch_id}-${Date.now()}`;
  const id = createCategory({ branch_id: Number(branch_id), name, slug, icon: icon || '🍽️', sort_order: sort_order || 0 });
  return NextResponse.json({ id, ok: true });
}
