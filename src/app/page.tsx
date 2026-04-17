import { initDb, getBranches, getSettings } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  initDb();
  const branches = getBranches() as Array<{ id: number; name: string; slug: string }>;
  const settings = getSettings();
  const name = settings.restaurant_name || 'Palet';
  const subtitle = settings.restaurant_subtitle || 'Lezzet Sanatı';

  return (
    <div
      style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
    >
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span style={{ height: 1, width: 40, background: 'linear-gradient(to right, transparent, var(--gold))' }} />
          <span style={{ color: 'var(--gold)', fontSize: 20 }}>✦</span>
          <span style={{ height: 1, width: 40, background: 'linear-gradient(to left, transparent, var(--gold))' }} />
        </div>
        <h1 className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)', fontSize: 32, letterSpacing: '0.2em' }}>
          {name}
        </h1>
        <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.25em', marginTop: 4 }}>
          {subtitle.toUpperCase()}
        </p>
      </div>

      {branches.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Henüz şube eklenmedi.</p>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-center text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Şube Seçin</p>
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/${branch.slug}`}
              className="block rounded-2xl p-5 text-center transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
            >
              <span className="font-semibold" style={{ fontSize: 16 }}>{branch.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
