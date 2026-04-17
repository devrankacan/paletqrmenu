import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getCategoriesByBranch, createCategory, createProduct, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
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

  const header = rows[0].map(normalizeHeader);

  const col = (name: string) => header.indexOf(name);
  const get = (row: string[], name: string) => row[col(name)] || '';

  // Load existing categories
  const existingCats = getCategoriesByBranch(branchId) as Array<{ id: number; name: string }>;
  const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c.id]));

  const getOrCreateCat = (name: string): number | null => {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    if (catMap.has(key)) return catMap.get(key)!;
    const newId = Number(createCategory({
      branch_id: branchId,
      name,
      slug: `${key.replace(/\s+/g, '-')}-${branchId}-${Date.now()}`,
      icon: '🍽️',
    }));
    catMap.set(key, newId);
    return newId;
  };

  // Detect WooCommerce format
  const isWoo = header.includes('type') && header.includes('parent');

  let imported = 0;
  const errors: string[] = [];

  if (isWoo) {
    // WooCommerce format: simple / variable / variation
    type Parent = { name: string; description: string; category: string; image: string };
    const parentMap = new Map<string, Parent>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const type = get(row, 'type').toLowerCase();
      const name = get(row, 'name');
      const sku = get(row, 'sku');
      const description = get(row, 'short_description');
      const priceRaw = get(row, 'regular_price').replace(',', '.');
      const category = get(row, 'categories').split(',')[0].trim(); // first category
      const image = get(row, 'images').split(',')[0].trim(); // first image
      const parentSku = get(row, 'parent');

      if (type === 'variable') {
        parentMap.set(sku, { name, description, category, image });
        continue;
      }

      if (type === 'variation') {
        const parent = parentMap.get(parentSku);
        const catName = parent?.category || category;
        const catId = getOrCreateCat(catName);
        if (!catId) { errors.push(`Satır ${i + 1}: kategori bulunamadı`); continue; }
        const price = parseFloat(priceRaw);
        if (isNaN(price) || price <= 0) { errors.push(`Satır ${i + 1}: geçersiz fiyat`); continue; }
        createProduct({
          category_id: catId,
          name: name || `${parent?.name} (varyasyon)`,
          description: parent?.description || description,
          price,
          image_url: image || parent?.image || '',
          is_featured: 0,
        });
        imported++;
        continue;
      }

      if (type === 'simple') {
        const catId = getOrCreateCat(category);
        if (!catId) { errors.push(`Satır ${i + 1}: kategori boş`); continue; }
        const price = parseFloat(priceRaw);
        if (isNaN(price) || price <= 0) { errors.push(`Satır ${i + 1}: geçersiz fiyat`); continue; }
        createProduct({ category_id: catId, name, description, price, image_url: image, is_featured: 0 });
        imported++;
      }
    }
  } else {
    // Simple CSV format: Ürün Adı, Açıklama, Fiyat, Kategori, Görsel URL, Öne Çıkan
    const idx = {
      name: header.findIndex((h) => h.includes('ad') || h.includes('name') || h === 'urun_adi'),
      description: header.findIndex((h) => h.includes('aciklama') || h.includes('desc')),
      price: header.findIndex((h) => h.includes('fiyat') || h.includes('price')),
      category: header.findIndex((h) => h.includes('kategori') || h.includes('cat')),
      image_url: header.findIndex((h) => h.includes('gorsel') || h.includes('image') || h.includes('url')),
      is_featured: header.findIndex((h) => h.includes('one') || h.includes('featured')),
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = idx.name >= 0 ? row[idx.name] : '';
      const price = parseFloat(((idx.price >= 0 ? row[idx.price] : '') || '0').replace(',', '.'));
      const categoryName = idx.category >= 0 ? row[idx.category] : '';
      if (!name) { errors.push(`Satır ${i + 1}: ürün adı boş`); continue; }
      if (isNaN(price)) { errors.push(`Satır ${i + 1}: geçersiz fiyat`); continue; }
      const catId = getOrCreateCat(categoryName);
      if (!catId) { errors.push(`Satır ${i + 1}: kategori boş`); continue; }
      createProduct({
        category_id: catId,
        name,
        description: idx.description >= 0 ? row[idx.description] || '' : '',
        price,
        image_url: idx.image_url >= 0 ? row[idx.image_url] || '' : '',
        is_featured: idx.is_featured >= 0 && row[idx.is_featured] === '1' ? 1 : 0,
      });
      imported++;
    }
  }

  return NextResponse.json({ imported, errors, ok: true });
}
