'use client';

import { useState } from 'react';

type Product = { id: number; name: string; description: string; price: number; image_url: string; is_featured: number; is_available: number };
type Category = { id: number; name: string; slug: string; icon: string; sort_order: number; products: Product[] };
type BranchInfo = { name?: string; address?: string; phone?: string; working_hours?: string; wifi_password?: string; logo_url?: string; cover_url?: string };

export default function ThemeGrid({
  menuData, settings, branch,
}: {
  menuData: Category[]; settings: Record<string, string>; branch?: BranchInfo;
}) {
  const [activeCatId, setActiveCatId] = useState<number | 'all'>('all');
  const name = settings.restaurant_name || 'Restoran';
  const currency = settings.currency || '₺';
  const accent = '#E53E3E';

  const allProducts = menuData.flatMap((c) => c.products.map((p) => ({ ...p, categoryName: c.name })));
  const displayed = activeCatId === 'all'
    ? allProducts
    : menuData.find((c) => c.id === activeCatId)?.products.map((p) => ({ ...p, categoryName: menuData.find((c) => c.id === activeCatId)?.name || '' })) || [];

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #ebebeb' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {branch?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branch.logo_url} alt={name} style={{ height: 44, maxWidth: 160, objectFit: 'contain' }} />
          ) : (
            <>
              <div className="flex items-center justify-center rounded-xl font-black text-white text-lg"
                style={{ width: 44, height: 44, background: accent, flexShrink: 0 }}>
                {name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black truncate" style={{ color: '#1a1a1a', fontSize: 18 }}>{name}</p>
                {branch?.name && <p className="text-xs truncate" style={{ color: '#999' }}>{branch.name}</p>}
              </div>
            </>
          )}
          {branch?.logo_url && branch?.name && (
            <p className="text-xs truncate ml-2" style={{ color: '#999' }}>{branch.name}</p>
          )}
        </div>

        {/* Info bar */}
        {(branch?.working_hours || branch?.phone) && (
          <div className="flex gap-4 px-4 pb-3">
            {branch.working_hours && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#666' }}>🕐 {branch.working_hours}</span>
            )}
            {branch.phone && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#666' }}>📞 {branch.phone}</span>
            )}
          </div>
        )}
      </header>

      {/* Cover image */}
      {branch?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.cover_url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-3 py-3" style={{ scrollbarWidth: 'none', background: '#fff', borderBottom: '1px solid #ebebeb' }}>
        <button
          onClick={() => setActiveCatId('all')}
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: activeCatId === 'all' ? accent : '#f0f0f0',
            color: activeCatId === 'all' ? '#fff' : '#555',
          }}>
          Tümü
        </button>
        {menuData.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCatId(c.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeCatId === c.id ? accent : '#f0f0f0',
              color: activeCatId === c.id ? '#fff' : '#555',
            }}>
            <span>{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="px-3 py-3 pb-10">
        {displayed.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#aaa', fontSize: 14 }}>Ürün bulunamadı</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {displayed.map((p) => (
              <div key={p.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div className="flex items-center justify-center text-3xl"
                    style={{ width: '100%', height: 100, background: '#f9f9f9', color: '#ddd' }}>
                    🍽️
                  </div>
                )}
                <div style={{ padding: '10px 10px 12px' }}>
                  {p.is_featured === 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full inline-block mb-1"
                      style={{ background: '#fff5e0', color: '#d97706', fontSize: 9, fontWeight: 700 }}>★ ÖNE ÇIKAN</span>
                  )}
                  <p className="font-semibold leading-tight" style={{ color: '#1a1a1a', fontSize: 13 }}>{p.name}</p>
                  {p.description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#999' }}>{p.description}</p>
                  )}
                  <p className="font-black mt-2" style={{ color: accent, fontSize: 16 }}>
                    {currency}{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {branch && (branch.address || branch.wifi_password) && (
        <footer className="px-4 py-6 text-center" style={{ background: '#fff', borderTop: '1px solid #ebebeb' }}>
          <p className="font-bold" style={{ color: '#1a1a1a', fontSize: 15 }}>{name}</p>
          <div className="flex flex-col gap-1 mt-2">
            {branch.address && <p className="text-xs" style={{ color: '#999' }}>📍 {branch.address}</p>}
            {branch.wifi_password && <p className="text-xs" style={{ color: '#999' }}>📶 Wifi: {branch.wifi_password}</p>}
          </div>
        </footer>
      )}
    </div>
  );
}
