import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const safeName = path.basename(filename);

  for (const dir of ['data/uploads', 'public/uploads']) {
    try {
      const file = await readFile(path.join(process.cwd(), dir, safeName));
      const ext = safeName.split('.').pop()?.toLowerCase() || 'jpg';
      return new NextResponse(file, {
        headers: {
          'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      continue;
    }
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
