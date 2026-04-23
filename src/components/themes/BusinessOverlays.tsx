'use client';

import { useState, useRef, useEffect } from 'react';
import translations, { type Lang } from '@/lib/translations';

export type OverlayBranch = {
  address?: string; phone?: string; working_hours?: string;
  wifi_password?: string; instagram?: string; contact_email?: string;
  logo_url?: string; name?: string;
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 40,
  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
};

/* ── Info Drawer ─────────────────────────────────────────── */
export function InfoDrawer({
  branch, onClose, isDark = true, lang = 'tr',
}: {
  branch: OverlayBranch; onClose: () => void; isDark?: boolean; lang?: Lang;
}) {
  const [wifiCopied, setWifiCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbEmail, setFbEmail] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const tr = translations[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const c = isDark ? {
    bg: 'rgba(14,14,14,0.55)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.35)',
    iconBg: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.12)',
    copyBg: 'rgba(255,255,255,0.08)',
    copyColor: 'rgba(255,255,255,0.6)',
    copyBorder: 'rgba(255,255,255,0.12)',
  } : {
    bg: 'rgba(250,250,252,0.88)',
    text: '#111111',
    textSub: 'rgba(0,0,0,0.45)',
    textMuted: 'rgba(0,0,0,0.3)',
    iconBg: 'rgba(0,0,0,0.07)',
    border: 'rgba(0,0,0,0.08)',
    inputBg: 'rgba(0,0,0,0.04)',
    inputBorder: 'rgba(0,0,0,0.1)',
    copyBg: 'rgba(0,0,0,0.06)',
    copyColor: 'rgba(0,0,0,0.5)',
    copyBorder: 'rgba(0,0,0,0.1)',
  };

  const copyWifi = () => {
    if (!branch.wifi_password) return;
    navigator.clipboard.writeText(branch.wifi_password).then(() => {
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    });
  };

  const submitFeedback = () => {
    const to = branch.contact_email || '';
    const subject = encodeURIComponent('Menü Geri Bildirimi');
    const body = encodeURIComponent(`Gönderen: ${fbEmail}\n\n${fbMsg}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setFbSent(true);
    setFbEmail('');
    setFbMsg('');
    setTimeout(() => { setFbSent(false); setShowFeedback(false); }, 2000);
  };

  const instaUrl = branch.instagram
    ? branch.instagram.startsWith('http')
      ? branch.instagram
      : `https://instagram.com/${branch.instagram.replace(/^@/, '')}`
    : '';

  const hasBizInfo = branch.address || branch.phone || branch.working_hours || branch.wifi_password || branch.contact_email;

  const IconCircle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center flex-shrink-0"
      style={{ width: 42, height: 42, borderRadius: '50%', background: c.iconBg, fontSize: 18 }}>
      {children}
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{ color: c.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 16 }}>
      {children}
    </p>
  );

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    background: c.inputBg, border: `1px solid ${c.inputBorder}`,
    borderRadius: 10, padding: '10px 14px', color: c.text, fontSize: 14, outline: 'none',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div dir={dir} className="fixed top-0 left-0 h-full flex flex-col overflow-y-auto"
        style={{ width: 'min(320px, 85vw)', background: c.bg, backdropFilter: 'blur(20px)', zIndex: 50 }}>

        {/* Close button */}
        <div className="flex items-center justify-end flex-shrink-0 px-4 pt-4 pb-2">
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, background: c.iconBg, color: c.text, fontSize: 16 }}>
            ✕
          </button>
        </div>

        {/* Logo + name */}
        {(branch.logo_url || branch.name) && (
          <div className="flex flex-col items-center text-center px-6 py-6"
            style={{ borderBottom: `1px solid ${c.border}` }}>
            {branch.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branch.logo_url} alt={branch.name || ''}
                style={{ maxHeight: 80, maxWidth: 180, objectFit: 'contain', marginBottom: branch.name ? 12 : 0 }} />
            )}
            {branch.name && (
              <p className="font-bold" style={{ color: c.text, fontSize: 15, lineHeight: 1.4 }}>{branch.name}</p>
            )}
          </div>
        )}

        {/* Business info */}
        {hasBizInfo && (
          <div className="px-5 py-5" style={{ borderBottom: `1px solid ${c.border}` }}>
            <SectionLabel>{tr.businessInfo}</SectionLabel>
            <div className="flex flex-col gap-4">
              {branch.address && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                  target="_blank" rel="noreferrer" className="flex items-start gap-3">
                  <IconCircle>🏠</IconCircle>
                  <p style={{ color: c.text, fontSize: 13, lineHeight: 1.5, paddingTop: 10 }}>{branch.address}</p>
                </a>
              )}
              {branch.working_hours && (
                <div className="flex items-center gap-3">
                  <IconCircle>🕒</IconCircle>
                  <p style={{ color: c.text, fontSize: 13 }}>{branch.working_hours}</p>
                </div>
              )}
              {branch.contact_email && (
                <a href={`mailto:${branch.contact_email}`} className="flex items-center gap-3">
                  <IconCircle>✉️</IconCircle>
                  <p style={{ color: c.text, fontSize: 13 }}>{branch.contact_email}</p>
                </a>
              )}
              {branch.phone && (
                <a href={`tel:${branch.phone}`} className="flex items-center gap-3">
                  <IconCircle>📞</IconCircle>
                  <p style={{ color: c.text, fontSize: 13 }}>{branch.phone}</p>
                </a>
              )}
              {branch.wifi_password && (
                <div className="flex items-center gap-3">
                  <IconCircle>📶</IconCircle>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p style={{ color: c.text, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                      {branch.wifi_password}
                    </p>
                    <button onClick={copyWifi} className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: wifiCopied ? 'rgba(74,222,128,0.15)' : c.copyBg,
                        color: wifiCopied ? '#22c55e' : c.copyColor,
                        border: `1px solid ${wifiCopied ? 'rgba(74,222,128,0.3)' : c.copyBorder}`,
                      }}>
                      {wifiCopied ? tr.copied : tr.copy}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social media */}
        {branch.instagram && (
          <div className="px-5 py-5" style={{ borderBottom: `1px solid ${c.border}` }}>
            <SectionLabel>{tr.socialMedia}</SectionLabel>
            <div className="flex flex-col gap-3">
              <a href={instaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                <IconCircle>📸</IconCircle>
                <p style={{ color: c.text, fontSize: 13 }}>
                  {branch.instagram.startsWith('@') ? branch.instagram : `@${branch.instagram}`}
                </p>
              </a>
            </div>
          </div>
        )}

        {/* Feedback section */}
        <div className="px-5 py-5">
          <button onClick={() => setShowFeedback(!showFeedback)}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ background: showFeedback ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : c.iconBg }}>
            <div className="flex items-center justify-center flex-shrink-0"
              style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(201,169,110,0.2)', fontSize: 18 }}>
              ✉️
            </div>
            <span className="font-semibold text-sm" style={{ color: c.text }}>{tr.feedback}</span>
            <span className="ml-auto" style={{ color: c.textMuted, fontSize: 13 }}>{showFeedback ? '▲' : '▼'}</span>
          </button>

          {showFeedback && (
            <div className="flex flex-col gap-3 mt-3">
              {fbSent ? (
                <p className="text-center text-sm font-semibold py-4" style={{ color: '#22c55e' }}>{tr.thanks}</p>
              ) : (
                <>
                  <div>
                    <label className="block mb-1" style={{ color: c.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tr.feedbackEmail}</label>
                    <input type="email" value={fbEmail} onChange={(e) => setFbEmail(e.target.value)}
                      placeholder="ornek@email.com" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block mb-1" style={{ color: c.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tr.feedbackMessage}</label>
                    <textarea value={fbMsg} onChange={(e) => setFbMsg(e.target.value)}
                      placeholder={tr.feedbackPlaceholder} rows={4}
                      style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                  <button onClick={submitFeedback} disabled={!fbMsg.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm"
                    style={{
                      background: fbMsg.trim() ? 'linear-gradient(135deg,#C9A96E,#8B6914)' : c.iconBg,
                      color: fbMsg.trim() ? '#0d0d0d' : c.textMuted,
                      cursor: fbMsg.trim() ? 'pointer' : 'default',
                    }}>
                    {tr.send}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

/* ── Search Overlay ──────────────────────────────────────── */
type SearchProduct = {
  id: number; name: string; description: string; price: number;
  image_url: string; is_featured: number; categoryName: string;
};

type SearchCategory = {
  id: number; name: string;
  products: { id: number; name: string; description: string; price: number; image_url: string; is_featured: number; is_available: number }[];
};

export function SearchOverlay({
  menuData, currency, lang, isDark = true, onClose,
}: {
  menuData: SearchCategory[];
  currency: string;
  lang: Lang;
  isDark?: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tr = translations[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const c = isDark ? {
    bg: 'rgba(14,14,14,0.97)',
    text: '#fff',
    textSub: 'rgba(255,255,255,0.5)',
    border: 'rgba(255,255,255,0.09)',
    itemBg: 'rgba(255,255,255,0.05)',
    inputColor: '#fff',
    accent: '#C9A96E',
  } : {
    bg: 'rgba(250,250,252,0.97)',
    text: '#111',
    textSub: 'rgba(0,0,0,0.4)',
    border: 'rgba(0,0,0,0.08)',
    itemBg: 'rgba(0,0,0,0.03)',
    inputColor: '#111',
    accent: '#E53E3E',
  };

  const results: SearchProduct[] = query.trim().length > 0
    ? menuData.flatMap((cat) =>
        cat.products
          .filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
          )
          .map((p) => ({ ...p, categoryName: cat.name }))
      )
    : [];

  return (
    <div dir={dir} className="fixed inset-0 flex flex-col"
      style={{ background: c.bg, backdropFilter: 'blur(20px)', zIndex: 100 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${c.border}` }}>
        <span style={{ color: c.textSub, fontSize: 20 }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr.searchPlaceholder}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: c.inputColor, fontSize: 16, caretColor: c.accent,
          }}
        />
        <button onClick={onClose}
          style={{ color: c.textSub, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {query.trim() && results.length === 0 && (
          <p className="text-center py-16" style={{ color: c.textSub, fontSize: 14 }}>{tr.noResults}</p>
        )}
        {!query.trim() && (
          <p className="text-center py-16" style={{ color: c.textSub, fontSize: 13 }}>
            {tr.searchPlaceholder}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {results.map((p) => (
            <div key={p.id} className="flex rounded-2xl overflow-hidden"
              style={{ background: c.itemBg, border: `1px solid ${c.border}` }}>
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name}
                  style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              )}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <p style={{ color: c.textSub, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                    {p.categoryName}
                  </p>
                  <p className="font-semibold leading-snug" style={{ color: c.text, fontSize: 14 }}>{p.name}</p>
                  {p.description && (
                    <p className="line-clamp-1" style={{ color: c.textSub, fontSize: 12, marginTop: 2 }}>{p.description}</p>
                  )}
                </div>
                <p className="font-bold" style={{ color: c.accent, fontSize: 15, marginTop: 4 }}>
                  {currency}{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Product Modal ───────────────────────────────────────── */
export type ProductModalProduct = {
  id: number; name: string; description: string;
  price: number; image_url: string; is_featured: number;
};

export function ProductModal({
  product, currency, isDark, featuredLabel, onClose,
}: {
  product: ProductModalProduct;
  currency: string;
  isDark: boolean;
  featuredLabel: string;
  onClose: () => void;
}) {
  const c = isDark ? {
    bg: '#1c1c1c',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.6)',
    accent: '#C9A96E',
    overlay: 'rgba(0,0,0,0.78)',
    closeIconBg: 'rgba(0,0,0,0.55)',
    closeIconColor: '#fff',
    featuredBg: 'rgba(201,169,110,0.15)',
    featuredColor: '#C9A96E',
    featuredBorder: 'rgba(201,169,110,0.3)',
    placeholder: 'rgba(255,255,255,0.06)',
  } : {
    bg: '#ffffff',
    text: '#1a1a1a',
    textSub: '#666',
    accent: '#E53E3E',
    overlay: 'rgba(0,0,0,0.55)',
    closeIconBg: 'rgba(255,255,255,0.88)',
    closeIconColor: '#333',
    featuredBg: '#fff5e0',
    featuredColor: '#d97706',
    featuredBorder: '#fde68a',
    placeholder: '#f0f0f0',
  };

  const fmt = (n: number) => n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);

  return (
    <>
      <div
        className="modal-fade-in"
        style={{ position: 'fixed', inset: 0, zIndex: 90, background: c.overlay, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="modal-slide-up"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: c.bg, borderRadius: '24px 24px 0 0',
          maxHeight: '88vh', overflowY: 'auto',
          maxWidth: 640, margin: '0 auto',
        }}>
        {/* Image area */}
        <div style={{ position: 'relative' }}>
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url} alt={product.name}
              style={{ width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain', display: 'block', borderRadius: '24px 24px 0 0', background: c.placeholder }}
            />
          ) : (
            <div style={{ width: '100%', height: 140, background: c.placeholder, borderRadius: '24px 24px 0 0' }} />
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 36, height: 36, borderRadius: '50%',
              background: c.closeIconBg, backdropFilter: 'blur(8px)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: c.closeIconColor, fontSize: 16, lineHeight: 1,
            }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '22px 22px 40px' }}>
          {product.is_featured === 1 && (
            <span style={{
              display: 'inline-block', marginBottom: 10,
              background: c.featuredBg, color: c.featuredColor,
              border: `1px solid ${c.featuredBorder}`,
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            }}>★ {featuredLabel}</span>
          )}
          <h2 style={{ color: c.text, fontSize: 22, fontWeight: 800, lineHeight: 1.3, margin: 0, marginBottom: 10 }}>
            {product.name}
          </h2>
          {product.description && (
            <p style={{ color: c.textSub, fontSize: 14, lineHeight: 1.65, margin: 0, marginBottom: 18 }}>
              {product.description}
            </p>
          )}
          <p style={{ color: c.accent, fontSize: 30, fontWeight: 900, margin: 0 }}>
            {currency}{fmt(product.price)}
          </p>
        </div>
      </div>
    </>
  );
}

/* ── FeedbackModal kept for backwards compat (unused) ────── */
export function FeedbackModal({ onClose }: { branch: OverlayBranch; onClose: () => void }) {
  onClose();
  return null;
}
