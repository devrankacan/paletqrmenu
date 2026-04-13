import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminUser, createAdminUser, adminUserExists, initDb } from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  initDb();
  const { action, username, password } = await req.json();

  if (action === 'setup') {
    if (adminUserExists()) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    createAdminUser(username, hash);
    const token = await signToken({ username });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  if (action === 'login') {
    const user = getAdminUser(username);
    if (!user) return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    const token = await signToken({ username });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  initDb();
  return NextResponse.json({ hasAdmin: adminUserExists() });
}
