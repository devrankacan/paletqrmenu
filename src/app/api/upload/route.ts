import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DIMENSION = 1920;

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/heic', 'image/heif'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Desteklenmeyen dosya formatı' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya 20MB\'dan küçük olmalı' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'data', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `upload-${Date.now()}.webp`;

  // SVG'yi olduğu gibi kaydet, diğerlerini WebP'ye çevir ve optimize et
  if (file.type === 'image/svg+xml') {
    const svgFilename = `upload-${Date.now()}.svg`;
    await writeFile(path.join(uploadDir, svgFilename), buffer);
    const basePath = process.env.BASE_PATH || '';
    return NextResponse.json({ url: `${basePath}/api/files/${svgFilename}` });
  }

  try {
    await sharp(buffer)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, filename));
  } catch (err) {
    console.error('[upload] sharp error:', err);
    // sharp başarısız olursa orijinal dosyayı kaydet
    const fallbackExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fallbackName = `upload-${Date.now()}.${fallbackExt}`;
    await writeFile(path.join(uploadDir, fallbackName), buffer);
    const basePath = process.env.BASE_PATH || '';
    return NextResponse.json({ url: `${basePath}/api/files/${fallbackName}` });
  }

  const basePath = process.env.BASE_PATH || '';
  return NextResponse.json({ url: `${basePath}/api/files/${filename}` });
}
