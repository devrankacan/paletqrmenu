'use client';

import { useState } from 'react';

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

export default function ThemeBanner({
  menuData, settings, branch,
}: {
  menuData: Category[]; settings: Record<string, string>; branch?: BranchInfo;
}) {
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbEmail, setFbEmail] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [wifiCopied, setWifiCopied] = useState(false);

  const name = settings.restaurant_name || 'Restoran';
  const currency = settings.currency || '₺';

  const getCoverImage = (cat: Category) =>
    cat.cover_url || cat.products.find((p) => p.image_url)?.image_url || '';

  const copyWifi = () => {
    if (!branch?.wifi_password) return;
    navigator.clipboard.writeText(branch.wifi_password).then(() => {
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    });
  };

  const submitFeedback = () => {
    const to = branch?.contact_email || '';
    const subject = encodeURIComponent('Menü Geri Bildirimi');
    const body = encodeURIComponent(`Gönderen: ${fbEmail}\n\n${fbMsg}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setShowFeedback(false);
    setFbEmail('');
    setFbMsg('');
  };

  const instaUrl = branch?.instagram
    ? branch.instagram.startsWith('http')
      ? branch.instagram
      : `https://instagram.com/${branch.instagram.replace(/^@/, '')}`
    : '';

  const hasInfo = branch && (branch.address || branch.working_hours || branch.wifi_password || branch.instagram || branch.phone);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 40,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
  };
  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', marginTop: 6,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  /* ── shared header buttons ── */
  const InfoBtn = () => hasInfo ? (
    <button onClick={() => setShowInfo(true)}
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 20 }}
      aria-label="İşletme bilgileri">
      ☰
    </button>
  ) : <div style={{ width: 40 }} />;

  const FeedbackBtn = () => (
    <button onClick={() => setShowFeedback(true)}
      className="flex items-center gap-1.5 px-3 h-10 rounded-xl flex-shrink-0 text-sm font-semibold"
      style={{ background: 'rgba(201,169,110,0.15)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)' }}
      aria-label="Geri bildirim">
      ✉ <span className="hidden sm:inline">Geri Bildirim</span>
    </button>
  );

  /* ── Info Drawer ── */
  const InfoDrawer = () => (
    <>
      <div style={overlayStyle} onClick={() => setShowInfo(false)} />
      <div className="fixed top-0 left-0 h-full flex flex-col"
        style={{ width: 'min(300px, 82vw)', background: '#111', borderRight: '1px solid rgba(255,255,255,0.1)', zIndex: 50 }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="font-bold uppercase tracking-widest" style={{ color: '#C9A96E', fontSize: 13 }}>Bilgi</span>
          <button onClick={() => setShowInfo(false)} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        <div className="flex flex-col gap-6 px-5 py-6 overflow-y-auto flex-1">
          {branch?.working_hours && (
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 22, flexShrink: 0 }}>🕒</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Çalışma Saatleri</p>
                <p style={{ color: '#fff', fontSize: 14 }}>{branch.working_hours}</p>
              </div>
            </div>
          )}
          {branch?.wifi_password && (
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 22, flexShrink: 0 }}>📶</span>
              <div className="flex-1 min-w-0">
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Wi-Fi Şifresi</p>
                <div className="flex items-center gap-2">
                  <p style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace', wordBreak: 'break-all' }}>{branch.wifi_password}</p>
                  <button onClick={copyWifi}
                    className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: wifiCopied ? 'rgba(74,222,128,0.15)' : 'rgba(201,169,110,0.15)', color: wifiCopied ? '#4ade80' : '#C9A96E', border: `1px solid ${wifiCopied ? 'rgba(74,222,128,0.3)' : 'rgba(201,169,110,0.3)'}` }}>
                    {wifiCopied ? '✓ Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {branch?.address && (
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 22, flexShrink: 0 }}>📍</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Adres</p>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: '#C9A96E', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {branch.address} ↗
                </a>
              </div>
            </div>
          )}
          {branch?.phone && (
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 22, flexShrink: 0 }}>📞</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Telefon</p>
                <a href={`tel:${branch.phone}`} style={{ color: '#C9A96E', fontSize: 14 }}>{branch.phone}</a>
              </div>
            </div>
          )}
          {instaUrl && (
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 22, flexShrink: 0 }}>📸</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Instagram</p>
                <a href={instaUrl} target="_blank" rel="noreferrer"
                  style={{ color: '#C9A96E', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {branch?.instagram?.startsWith('@') ? branch.instagram : `@${branch?.instagram}`} ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  /* ── Feedback Modal ── */
  const FeedbackModal = () => (
    <>
      <div style={overlayStyle} onClick={() => setShowFeedback(false)} />
      <div className="fixed flex flex-col gap-4 rounded-2xl p-6"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 'min(380px, calc(100vw - 32px))',
          background: '#131313', border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50, maxHeight: '90vh', overflowY: 'auto',
        }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold" style={{ color: '#C9A96E', fontSize: 17 }}>✉ Geri Bildirim</h3>
          <button onClick={() => setShowFeedback(false)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>E-posta adresiniz</label>
          <input type="email" value={fbEmail} onChange={(e) => setFbEmail(e.target.value)}
            placeholder="ornek@email.com" style={inputStyle} />
        </div>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mesajınız *</label>
          <textarea value={fbMsg} onChange={(e) => setFbMsg(e.target.value)}
            placeholder="Görüş ve önerilerinizi yazın..." rows={5}
            style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <button onClick={submitFeedback} disabled={!fbMsg.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{
            background: fbMsg.trim() ? 'linear-gradient(135deg,#C9A96E,#8B6914)' : 'rgba(255,255,255,0.08)',
            color: fbMsg.trim() ? '#0d0d0d' : 'rgba(255,255,255,0.3)',
            cursor: fbMsg.trim() ? 'pointer' : 'default',
          }}>
          Gönder
        </button>
      </div>
    </>
  );

  /* ── Product view ── */
  if (activeCat) {
    return (
      <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
        {showInfo && <InfoDrawer />}
        {showFeedback && <FeedbackModal />}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <InfoBtn />
          <button onClick={() => setActiveCat(null)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18 }}>
            ←
          </button>
          <h2 className="font-bold uppercase tracking-wider flex-1 truncate" style={{ color: '#fff', fontSize: 16 }}>
            {activeCat.name}
          </h2>
          <FeedbackBtn />
        </header>

        <div className="flex flex-col gap-3 p-4 pb-24">
          {activeCat.products.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Henüz ürün eklenmedi</div>
          ) : (
            activeCat.products.map((p) => (
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
                    {p.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.description}</p>
                    )}
                  </div>
                  <p className="font-bold mt-2" style={{ color: '#C9A96E', fontSize: 16 }}>
                    {currency}{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ── Category list view ── */
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      {showInfo && <InfoDrawer />}
      {showFeedback && <FeedbackModal />}

      <header className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
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
        <FeedbackBtn />
      </header>

      {branch?.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branch.cover_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      )}

      <div className="flex flex-col gap-3 px-3 py-3 pb-12">
        {menuData.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Henüz kategori eklenmedi</div>
        ) : (
          menuData.map((cat, idx) => {
            const cover = getCoverImage(cat);
            return (
              <button key={cat.id} onClick={() => setActiveCat(cat)}
                className="relative w-full rounded-2xl overflow-hidden text-left"
                style={{ height: 90 }}>
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
          })
        )}
      </div>
    </div>
  );
}
