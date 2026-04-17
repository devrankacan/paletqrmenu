import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getAllProductsWithCategory, getAllProductsWithCategoryByBranch, getProductsByCategory, initDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  initDb();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branch_id');
  const categoryId = searchParams.get('category_id');

  if (branchId) return NextResponse.json(getAllProductsWithCategoryByBranch(Number(branchId)));
  if (categoryId) return NextResponse.json(getProductsByCategory(Number(categoryId)));
  return NextResponse.json(getAllProductsWithCategory());
}

export async function POST(req: NextRequest) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { category_id, name, description, price, image_url, is_featured } = body;
  if (!category_id || !name || price === undefined) {
    return NextResponse.json({ error: 'category_id, name ve price zorunludur' }, { status: 400 });
  }

  const id = createProduct({
    category_id: Number(category_id), name,
    description: description || '', price: Number(price),
    image_url: image_url || '', is_featured: is_featured ? 1 : 0,
  });
  return NextResponse.json({ id, ok: true });
}
