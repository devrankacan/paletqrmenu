import { NextResponse } from 'next/server';
import { getCategories, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  return NextResponse.json(getCategories());
}
