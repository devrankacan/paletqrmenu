'use client';

import { useState } from 'react';

export type OverlayBranch = {
  address?: string; phone?: string; working_hours?: string;
  wifi_password?: string; instagram?: string; contact_email?: string;
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 40,
  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
};

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

  const Row = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</p>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div className="fixed top-0 left-0 h-full flex flex-col"
        style={{ width: 'min(300px, 82vw)', background: '#111', borderRight: '1px solid rgba(255,255,255,0.1)', zIndex: 50 }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="font-bold uppercase tracking-widest" style={{ color: '#C9A96E', fontSize: 13 }}>Bilgi</span>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        <div className="flex flex-col gap-6 px-5 py-6 overflow-y-auto flex-1">
          {branch.working_hours && (
            <Row icon="🕒" label="Çalışma Saatleri">
              <p style={{ color: '#fff', fontSize: 14 }}>{branch.working_hours}</p>
            </Row>
          )}
          {branch.wifi_password && (
            <Row icon="📶" label="Wi-Fi Şifresi">
              <div className="flex items-center gap-2 flex-wrap">
                <p style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace', wordBreak: 'break-all' }}>{branch.wifi_password}</p>
                <button onClick={copyWifi}
                  className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ background: wifiCopied ? 'rgba(74,222,128,0.15)' : 'rgba(201,169,110,0.15)', color: wifiCopied ? '#4ade80' : '#C9A96E', border: `1px solid ${wifiCopied ? 'rgba(74,222,128,0.3)' : 'rgba(201,169,110,0.3)'}` }}>
                  {wifiCopied ? '✓ Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </Row>
          )}
          {branch.address && (
            <Row icon="📍" label="Adres">
              <a href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                target="_blank" rel="noreferrer"
                style={{ color: '#C9A96E', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {branch.address} ↗
              </a>
            </Row>
          )}
          {branch.phone && (
            <Row icon="📞" label="Telefon">
              <a href={`tel:${branch.phone}`} style={{ color: '#C9A96E', fontSize: 14 }}>{branch.phone}</a>
            </Row>
          )}
          {instaUrl && (
            <Row icon="📸" label="Instagram">
              <a href={instaUrl} target="_blank" rel="noreferrer"
                style={{ color: '#C9A96E', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {branch.instagram?.startsWith('@') ? branch.instagram : `@${branch.instagram}`} ↗
              </a>
            </Row>
          )}
        </div>
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
