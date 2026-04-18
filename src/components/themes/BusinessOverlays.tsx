'use client';

import { useState } from 'react';

export type OverlayBranch = {
  address?: string; phone?: string; working_hours?: string;
  wifi_password?: string; instagram?: string; contact_email?: string;
  logo_url?: string; name?: string;
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 40,
  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
};

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0"
      style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', fontSize: 17 }}>
      {children}
    </div>
  );
}

/* ── Info Drawer ─────────────────────────────────────────── */
export function InfoDrawer({ branch, onClose }: { branch: OverlayBranch; onClose: () => void }) {
  const [wifiCopied, setWifiCopied] = useState(false);

  const copyWifi = () => {
    if (!branch.wifi_password) return;
    navigator.clipboard.writeText(branch.wifi_password).then(() => {
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    });
  };

  const instaUrl = branch.instagram
    ? branch.instagram.startsWith('http')
      ? branch.instagram
      : `https://instagram.com/${branch.instagram.replace(/^@/, '')}`
    : '';

  const hasBusinessInfo = branch.address || branch.phone || branch.working_hours || branch.wifi_password || branch.contact_email;

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div className="fixed top-0 left-0 h-full flex flex-col overflow-y-auto"
        style={{ width: 'min(320px, 85vw)', background: '#1c1c1c', zIndex: 50 }}>

        {/* Gradient header */}
        <div className="flex items-center justify-between flex-shrink-0 px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2744)', minHeight: 62 }}>
          <span className="font-bold" style={{ color: '#fff', fontSize: 18, letterSpacing: '0.01em' }}>Hoşgeldiniz!</span>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 16 }}>
            ✕
          </button>
        </div>

        {/* Logo + name */}
        {(branch.logo_url || branch.name) && (
          <div className="flex flex-col items-center text-center px-6 py-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {branch.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branch.logo_url} alt={branch.name || ''}
                style={{ maxHeight: 80, maxWidth: 180, objectFit: 'contain', marginBottom: branch.name ? 12 : 0 }} />
            )}
            {branch.name && (
              <p className="font-bold" style={{ color: '#fff', fontSize: 15, lineHeight: 1.4 }}>{branch.name}</p>
            )}
          </div>
        )}

        {/* Business info */}
        {hasBusinessInfo && (
          <div className="px-5 py-5"
            style={{ borderBottom: branch.instagram ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
            <p className="mb-4" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              İşletme Bilgileri
            </p>
            <div className="flex flex-col gap-4">
              {branch.address && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                  target="_blank" rel="noreferrer" className="flex items-start gap-3">
                  <IconCircle>🏠</IconCircle>
                  <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.5, paddingTop: 9 }}>{branch.address}</p>
                </a>
              )}
              {branch.working_hours && (
                <div className="flex items-center gap-3">
                  <IconCircle>🕒</IconCircle>
                  <p style={{ color: '#fff', fontSize: 13 }}>{branch.working_hours}</p>
                </div>
              )}
              {branch.contact_email && (
                <a href={`mailto:${branch.contact_email}`} className="flex items-center gap-3">
                  <IconCircle>✉️</IconCircle>
                  <p style={{ color: '#fff', fontSize: 13 }}>{branch.contact_email}</p>
                </a>
              )}
              {branch.phone && (
                <a href={`tel:${branch.phone}`} className="flex items-center gap-3">
                  <IconCircle>📞</IconCircle>
                  <p style={{ color: '#fff', fontSize: 13 }}>{branch.phone}</p>
                </a>
              )}
              {branch.wifi_password && (
                <div className="flex items-center gap-3">
                  <IconCircle>📶</IconCircle>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p style={{ color: '#fff', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                      {branch.wifi_password}
                    </p>
                    <button onClick={copyWifi} className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: wifiCopied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.1)',
                        color: wifiCopied ? '#4ade80' : 'rgba(255,255,255,0.7)',
                        border: `1px solid ${wifiCopied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.15)'}`,
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
          <div className="px-5 py-5">
            <p className="mb-4" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Sosyal Medya Hesaplarımız
            </p>
            <div className="flex flex-col gap-3">
              <a href={instaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                <IconCircle>📸</IconCircle>
                <p style={{ color: '#fff', fontSize: 13 }}>
                  {branch.instagram.startsWith('@') ? branch.instagram : `@${branch.instagram}`}
                </p>
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Feedback Modal ──────────────────────────────────────── */
export function FeedbackModal({ branch, onClose }: { branch: OverlayBranch; onClose: () => void }) {
  const [fbEmail, setFbEmail] = useState('');
  const [fbMsg, setFbMsg] = useState('');

  const submit = () => {
    const to = branch.contact_email || '';
    const subject = encodeURIComponent('Menü Geri Bildirimi');
    const body = encodeURIComponent(`Gönderen: ${fbEmail}\n\n${fbMsg}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    onClose();
    setFbEmail('');
    setFbMsg('');
  };

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', marginTop: 6, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div className="fixed flex flex-col gap-4 rounded-2xl p-6"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 'min(380px, calc(100vw - 32px))',
          background: '#131313', border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50, maxHeight: '90vh', overflowY: 'auto',
        }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold" style={{ color: '#C9A96E', fontSize: 17 }}>✉ Geri Bildirim</h3>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, lineHeight: 1 }}>✕</button>
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
        <button onClick={submit} disabled={!fbMsg.trim()}
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
}
