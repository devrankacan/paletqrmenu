import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getCategoriesByBranch, createCategory, createProduct, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const cols: string[] = [];
      let cur = '';
      let inQuote = false;
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    })
    .filter((row) => row.some((c) => c !== ''));
}

export async function POST(req: NextRequest) {
  initDb();
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = Number(searchParams.get('branch_id'));
  if (!branchId) return NextResponse.json({ error: 'branch_id gerekli' }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return NextResponse.json({ error: 'CSV boş veya geçersiz' }, { status: 400 });

  // Detect header row
  const header = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const idx = {
    name: header.findIndex((h) => h.includes('ad') || h.includes('name') || h === 'ürün_adı'),
    description: header.findIndex((h) => h.includes('açıklama') || h.includes('desc')),
    price: header.findIndex((h) => h.includes('fiyat') || h.includes('price')),
    category: header.findIndex((h) => h.includes('kategori') || h.includes('cat')),
    image_url: header.findIndex((h) => h.includes('görsel') || h.includes('image') || h.includes('url')),
    is_featured: header.findIndex((h) => h.includes('öne') || h.includes('featured')),
  };

  if (idx.name === -1 || idx.price === -1 || idx.category === -1) {
    return NextResponse.json({ error: 'CSV başlıklarında "Ürün Adı", "Fiyat" ve "Kategori" sütunları olmalı' }, { status: 400 });
  }

  // Load existing categories for this branch
  const existingCats = getCategoriesByBranch(branchId) as Array<{ id: number; name: string }>;
  const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[idx.name] || '';
    const price = parseFloat((row[idx.price] || '0').replace(',', '.'));
    const categoryName = idx.category >= 0 ? (row[idx.category] || '') : '';
    const description = idx.description >= 0 ? (row[idx.description] || '') : '';
    const image_url = idx.image_url >= 0 ? (row[idx.image_url] || '') : '';
    const is_featured = idx.is_featured >= 0 ? (row[idx.is_featured] === '1' ? 1 : 0) : 0;

    if (!name) { errors.push(`Satır ${i + 1}: ürün adı boş`); continue; }
    if (isNaN(price)) { errors.push(`Satır ${i + 1}: geçersiz fiyat`); continue; }
    if (!categoryName) { errors.push(`Satır ${i + 1}: kategori boş`); continue; }

    // Find or create category
    let catId = catMap.get(categoryName.toLowerCase());
    if (!catId) {
      const newCatId = createCategory({
        branch_id: branchId,
        name: categoryName,
        slug: `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${branchId}-${Date.now()}`,
        icon: '🍽️',
      });
      catId = Number(newCatId);
      catMap.set(categoryName.toLowerCase(), catId);
    }

    createProduct({ category_id: catId, name, description, price, image_url, is_featured });
    imported++;
  }

  return NextResponse.json({ imported, errors, ok: true });
}
