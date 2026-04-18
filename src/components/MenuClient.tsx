'use client';

import { useState } from 'react';
import { InfoDrawer, FeedbackModal } from '@/components/themes/BusinessOverlays';

type Product = {
  id: number; name: string; description: string; price: number;
  image_url: string; is_featured: number; is_available: number;
};
type Category = {
  id: number; name: string; slug: string; icon: string; sort_order: number;
  products: Product[]; cover_url?: string;
};
type Settings = Record<string, string>;
type BranchInfo = {
  name?: string; address?: string; phone?: string; working_hours?: string;
  wifi_password?: string; logo_url?: string; cover_url?: string;
  instagram?: string; contact_email?: string;
};

const CAT_GRADIENTS = [
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#0f3460,#533483)',
  'linear-gradient(135deg,#1b1b2f,#2c2c54)',
  'linear-gradient(135deg,#0d0d0d,#1a0a00)',
  'linear-gradient(135deg,#0a1628,#1e3a5f)',
  'linear-gradient(135deg,#1a0a00,#3d1c02)',
];

export default function MenuClient({ menuData, settings, branch }: {
  menuData: Category[]; settings: Settings; branch?: BranchInfo;
}) {
  const [activeCatId, setActiveCatId] = useState<number>(() => menuData[0]?.id ?? 0);
  const [showInfo, setShowInfo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const name = settings.restaurant_name || 'Palet';
  const subtitle = settings.restaurant_subtitle || 'Lezzet Sanatı';
  const currency = settings.currency || '₺';
  const hasInfo = branch && (branch.address || branch.working_hours || branch.wifi_password || branch.instagram || branch.phone);
  const activeCat = menuData.find((c) => c.id === activeCatId);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {showInfo && <InfoDrawer branch={{ ...(branch ?? {}), name, logo_url: branch?.logo_url }} onClose={() => setShowInfo(false)} />}
      {showFeedback && <FeedbackModal branch={branch ?? {}} onClose={() => setShowFeedback(false)} />}

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50"
        style={{ background: 'rgba(13,13,13,0.97)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          {/* Logo or name */}
          {branch?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branch.logo_url} alt={name} className="object-contain"
              style={{ maxHeight: 44, maxWidth: 160 }} />
          ) : (
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦</span>
              <span className="font-bold tracking-widest uppercase"
                style={{ color: 'var(--text-primary)', fontSize: 16 }}>{name}</span>
            </div>
          )}
          {/* Buttons */}
          <div className="flex items-center gap-2">
            {hasInfo && (
              <button onClick={() => setShowInfo(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface)', color: 'var(--gold)', border: '1px solid var(--border)', fontSize: 17 }}>
                ☰
              </button>
            )}
            <button onClick={() => setShowFeedback(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.25)', fontSize: 15 }}>
              ✉
            </button>
          </div>
        </div>
      </header>

      {/* ─── BRANCH COVER ─── */}
      {branch?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.cover_url} alt=""
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      )}

      {/* ─── HERO (no cover) ─── */}
      {!branch?.cover_url && (
        <div className="text-center py-8"
          style={{ background: 'linear-gradient(to bottom, rgba(201,169,110,0.06) 0%, transparent 100%)' }}>
          <p className="font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--text-primary)', fontSize: 22 }}>{name}</p>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.25em', marginTop: 4 }}>
            {subtitle.toUpperCase()}
          </p>
        </div>
      )}

      {/* ─── VISUAL CATEGORY STRIP ─── */}
      <div className="sticky z-40 overflow-x-auto"
        style={{ top: 60, scrollbarWidth: 'none', background: 'rgba(13,13,13,0.97)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2 px-3 py-3" style={{ width: 'max-content' }}>
          {menuData.map((cat, idx) => {
            const isActive = cat.id === activeCatId;
            return (
              <button key={cat.id} onClick={() => setActiveCatId(cat.id)}
                className="relative rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  width: 88, height: 64,
                  outline: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  outlineOffset: 1,
                }}>
                {cat.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.cover_url} alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0"
                    style={{ background: CAT_GRADIENTS[idx % CAT_GRADIENTS.length] }} />
                )}
                <div className="absolute inset-0"
                  style={{ background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.55)' }} />
                <p className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 font-bold leading-tight text-center"
                  style={{ color: '#fff', fontSize: 10, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                  {cat.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CATEGORY COVER BANNER ─── */}
      {activeCat?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={activeCat.cover_url} alt={activeCat.name}
          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
      )}

      {/* ─── PRODUCTS ─── */}
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-5">
        {!activeCat || activeCat.products.length === 0 ? (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
            <p className="text-sm">Henüz ürün eklenmedi</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeCat.products.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="text-center pb-10 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span style={{ height: 1, width: 30, background: 'linear-gradient(to right, transparent, var(--gold))' }} />
          <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦</span>
          <span style={{ height: 1, width: 30, background: 'linear-gradient(to left, transparent, var(--gold))' }} />
        </div>
        <p className="font-bold tracking-widest uppercase" style={{ color: 'var(--gold)', fontSize: 13 }}>{name}</p>
        {branch && (branch.address || branch.phone || branch.working_hours || branch.wifi_password) && (
          <div className="mt-4 mx-auto max-w-xs flex flex-col gap-1.5">
            {branch.address && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📍 {branch.address}</p>}
            {branch.phone && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📞 {branch.phone}</p>}
            {branch.working_hours && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>🕐 {branch.working_hours}</p>}
            {branch.wifi_password && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📶 Wifi: {branch.wifi_password}</p>}
          </div>
        )}
      </footer>
    </div>
  );
}

function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const hasImage = !!product.image_url?.trim();
  return (
    <div className="rounded-2xl overflow-hidden flex"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {hasImage && (
        <div className="flex-shrink-0" style={{ width: 100, height: 100 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {product.is_featured === 1 && (
            <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1"
              style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.3)', fontSize: 10 }}>
              ★ ÖNE ÇIKAN
            </span>
          )}
          <h3 className="font-semibold leading-snug" style={{ color: 'var(--text-primary)', fontSize: 15 }}>{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{product.description}</p>
          )}
        </div>
        <span className="font-bold mt-3 block" style={{ color: 'var(--gold)', fontSize: 18 }}>
          {currency}{product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
