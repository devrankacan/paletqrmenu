'use client';

import { useState } from 'react';

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
  branch, onClose, isDark = true,
}: {
  branch: OverlayBranch; onClose: () => void; isDark?: boolean;
}) {
  const [wifiCopied, setWifiCopied] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbEmail, setFbEmail] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [fbSent, setFbSent] = useState(false);

  const c = isDark ? {
    bg: 'rgba(14,14,14,0.55)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.35)',
    iconBg: 'rgba(255,255,255,0.1)',
    iconBgHover: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.12)',
    copyBg: 'rgba(255,255,255,0.08)',
    copyColor: 'rgba(255,255,255,0.6)',
    copyBorder: 'rgba(255,255,255,0.12)',
  } : {
    bg: 'rgba(250,250,252,0.55)',
    text: '#111111',
    textSub: 'rgba(0,0,0,0.45)',
    textMuted: 'rgba(0,0,0,0.3)',
    iconBg: 'rgba(0,0,0,0.07)',
    iconBgHover: 'rgba(0,0,0,0.1)',
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
      <div className="fixed top-0 left-0 h-full flex flex-col overflow-y-auto"
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
            <SectionLabel>İşletme Bilgileri</SectionLabel>
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
                      {wifiCopied ? '✓' : 'Kopyala'}
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
            <SectionLabel>Sosyal Medya</SectionLabel>
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
            <span className="font-semibold text-sm" style={{ color: c.text }}>Geri Bildirim Gönder</span>
            <span className="ml-auto" style={{ color: c.textMuted, fontSize: 13 }}>{showFeedback ? '▲' : '▼'}</span>
          </button>

          {showFeedback && (
            <div className="flex flex-col gap-3 mt-3">
              {fbSent ? (
                <p className="text-center text-sm font-semibold py-4" style={{ color: '#22c55e' }}>Teşekkürler! ✓</p>
              ) : (
                <>
                  <div>
                    <label className="block mb-1" style={{ color: c.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>E-posta (isteğe bağlı)</label>
                    <input type="email" value={fbEmail} onChange={(e) => setFbEmail(e.target.value)}
                      placeholder="ornek@email.com" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block mb-1" style={{ color: c.textSub, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mesajınız *</label>
                    <textarea value={fbMsg} onChange={(e) => setFbMsg(e.target.value)}
                      placeholder="Görüş ve önerilerinizi yazın..." rows={4}
                      style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                  <button onClick={submitFeedback} disabled={!fbMsg.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm"
                    style={{
                      background: fbMsg.trim() ? 'linear-gradient(135deg,#C9A96E,#8B6914)' : c.iconBg,
                      color: fbMsg.trim() ? '#0d0d0d' : c.textMuted,
                      cursor: fbMsg.trim() ? 'pointer' : 'default',
                    }}>
                    Gönder
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

/* ── FeedbackModal kept for backwards compat (unused) ────── */
export function FeedbackModal({ onClose }: { branch: OverlayBranch; onClose: () => void }) {
  onClose();
  return null;
}
