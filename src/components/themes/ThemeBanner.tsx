'use client';

import { useState } from 'react';
import { InfoDrawer } from './BusinessOverlays';

type Product = { id: number; name: string; description: string; price: number; image_url: string; is_featured: number; is_available: number };
type Category = { id: number; name: string; slug: string; icon: string; sort_order: number; products: Product[]; cover_url?: string };
type BranchInfo = {
  name?: string; address?: string; phone?: string; working_hours?: string;
  wifi_password?: string; logo_url?: string; cover_url?: string;
  instagram?: string; contact_email?: string;
};

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #0f3460, #533483)',
  'linear-gradient(135deg, #1b1b2f, #2c2c54)',
  'linear-gradient(135deg, #0d0d0d, #1a0a00)',
  'linear-gradient(135deg, #0a1628, #1e3a5f)',
  'linear-gradient(135deg, #1a0a00, #3d1c02)',
];

export default function ThemeBanner({ menuData, settings, branch }: {
  menuData: Category[]; settings: Record<string, string>; branch?: BranchInfo;
}) {
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const name = settings.restaurant_name || 'Restoran';
  const currency = settings.currency || '₺';
  const hasInfo = branch && (branch.address || branch.working_hours || branch.wifi_password || branch.instagram || branch.phone);

  const getCoverImage = (cat: Category) =>
    cat.cover_url || cat.products.find((p) => p.image_url)?.image_url || '';

  const InfoBtn = () => (
    <button onClick={() => setShowInfo(true)}
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 20 }}>☰</button>
  );

  if (activeCat) {
    return (
      <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
        {showInfo && <InfoDrawer branch={{ ...branch!, name, logo_url: branch?.logo_url }} onClose={() => setShowInfo(false)} isDark={true} />}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <InfoBtn />
          <button onClick={() => setActiveCat(null)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18 }}>←</button>
          <h2 className="font-bold uppercase tracking-wider flex-1 truncate" style={{ color: '#fff', fontSize: 16 }}>{activeCat.name}</h2>
        </header>
        <div className="flex flex-col gap-3 p-4 pb-24">
          {activeCat.products.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Henüz ürün eklenmedi</div>
          ) : activeCat.products.map((p) => (
            <div key={p.id} className="flex rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="flex-shrink-0 object-cover" style={{ width: 100, height: 90 }} />
              )}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  {p.is_featured === 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full mr-1" style={{ background: 'rgba(201,169,110,0.2)', color: '#C9A96E', fontSize: 9 }}>★</span>
                  )}
                  <p className="font-semibold leading-snug" style={{ color: '#fff', fontSize: 14 }}>{p.name}</p>
                  {p.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.description}</p>}
                </div>
                <p className="font-bold mt-2" style={{ color: '#C9A96E', fontSize: 16 }}>
                  {currency}{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      {showInfo && <InfoDrawer branch={{ ...branch!, name, logo_url: branch?.logo_url }} onClose={() => setShowInfo(false)} isDark={true} />}
      <header className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <InfoBtn />
        <div className="flex-1 flex items-center justify-center px-2 min-w-0">
          {branch?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branch.logo_url} alt={name} className="object-contain" style={{ maxHeight: 40, maxWidth: 160 }} />
          ) : (
            <div className="text-center">
              <p className="font-black uppercase tracking-widest" style={{ color: '#fff', fontSize: 17, lineHeight: 1 }}>{name}</p>
              {branch?.name && <p className="text-xs tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{branch.name}</p>}
            </div>
          )}
        </div>
      </header>
      {branch?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.cover_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      )}
      <div className="flex flex-col gap-3 px-3 py-3 pb-12">
        {menuData.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Henüz kategori eklenmedi</div>
        ) : menuData.map((cat, idx) => {
          const cover = getCoverImage(cat);
          return (
            <button key={cat.id} onClick={() => setActiveCat(cat)}
              className="relative w-full rounded-2xl overflow-hidden text-left" style={{ height: 90 }}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: GRADIENTS[idx % GRADIENTS.length] }} />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.82) 45%, rgba(0,0,0,0.25))' }} />
              <div className="relative flex items-center h-full px-5">
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase tracking-widest truncate" style={{ color: '#fff', fontSize: 17, letterSpacing: '0.1em' }}>{cat.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{cat.products.length} ürün</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22 }}>›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
