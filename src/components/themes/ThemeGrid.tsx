'use client';

import { useState } from 'react';
import { InfoDrawer, FeedbackModal } from './BusinessOverlays';

type Product = { id: number; name: string; description: string; price: number; image_url: string; is_featured: number; is_available: number };
type Category = { id: number; name: string; slug: string; icon: string; sort_order: number; products: Product[]; cover_url?: string };
type BranchInfo = { name?: string; address?: string; phone?: string; working_hours?: string; wifi_password?: string; logo_url?: string; cover_url?: string; instagram?: string; contact_email?: string };

const CAT_GRADIENTS = [
  'linear-gradient(135deg,#e53e3e,#c0392b)',
  'linear-gradient(135deg,#d97706,#b45309)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#0284c7,#0369a1)',
  'linear-gradient(135deg,#db2777,#be185d)',
];

export default function ThemeGrid({
  menuData, settings, branch,
}: {
  menuData: Category[]; settings: Record<string, string>; branch?: BranchInfo;
}) {
  const [activeCatId, setActiveCatId] = useState<number>(() => menuData[0]?.id ?? 0);
  const [showInfo, setShowInfo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const name = settings.restaurant_name || 'Restoran';
  const currency = settings.currency || '₺';
  const accent = '#E53E3E';
  const hasInfo = branch && (branch.address || branch.working_hours || branch.wifi_password || branch.instagram || branch.phone);

  const activeCat = menuData.find((c) => c.id === activeCatId);
  const displayed = activeCat?.products.map((p) => ({ ...p, categoryName: activeCat.name })) ?? [];

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh' }}>
      {showInfo && <InfoDrawer branch={{ ...(branch ?? {}), name, logo_url: branch?.logo_url }} onClose={() => setShowInfo(false)} />}
      {showFeedback && <FeedbackModal branch={branch ?? {}} onClose={() => setShowFeedback(false)} />}

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
            <p className="text-xs truncate ml-2 flex-1 min-w-0" style={{ color: '#999' }}>{branch.name}</p>
          )}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {hasInfo && (
              <button onClick={() => setShowInfo(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: '#f0f0f0', color: '#444' }}>
                ☰ Bilgi
              </button>
            )}
            <button onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#fff0f0', color: '#E53E3E', border: '1px solid #ffd5d5' }}>
              ✉
            </button>
          </div>
        </div>
      </header>

      {/* Branch cover */}
      {branch?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.cover_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
      )}

      {/* Visual category selector — horizontal scroll */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', background: '#fff', borderBottom: '2px solid #ebebeb' }}>
        <div className="flex gap-2 px-3 py-3" style={{ width: 'max-content' }}>
          {menuData.map((c, idx) => {
            const isActive = c.id === activeCatId;
            return (
              <button key={c.id} onClick={() => setActiveCatId(c.id)}
                className="relative rounded-2xl overflow-hidden flex-shrink-0 text-left"
                style={{
                  width: 96, height: 72,
                  outline: isActive ? `3px solid ${accent}` : '3px solid transparent',
                  outlineOffset: 1,
                }}>
                {c.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover_url} alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0"
                    style={{ background: CAT_GRADIENTS[idx % CAT_GRADIENTS.length] }} />
                )}
                <div className="absolute inset-0"
                  style={{ background: isActive ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.5)' }} />
                <p className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 font-bold leading-tight"
                  style={{ color: '#fff', fontSize: 11, lineHeight: 1.25,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {c.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <div className="px-3 py-3 pb-10">
        {displayed.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#aaa', fontSize: 14 }}>Bu kategoride ürün yok</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {displayed.map((p) => (
              <div key={p.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name}
                    style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: 100, background: '#f0f0f0' }} />
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
