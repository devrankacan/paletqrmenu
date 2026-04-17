'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function AdminLogin() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(apiUrl('/api/auth'))
      .then((r) => r.json())
      .then((d) => setIsSetup(d.hasAdmin))
      .catch(() => setIsSetup(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSetup && password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isSetup ? 'login' : 'setup', username, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Hata oluştu');
    } else {
      router.push('/admin');
    }
  };

  if (isSetup === null) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--gold)', fontSize: 24 }}>✦</div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span style={{ height: 1, width: 32, background: 'linear-gradient(to right, transparent, var(--gold))' }} />
            <span style={{ color: 'var(--gold)', fontSize: 20 }}>✦</span>
            <span style={{ height: 1, width: 32, background: 'linear-gradient(to left, transparent, var(--gold))' }} />
          </div>
          <h1 className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)', fontSize: 22, letterSpacing: '0.2em' }}>
            Palet
          </h1>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.25em', marginTop: 4 }}>
            ADMIN PANELİ
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-center font-semibold mb-6" style={{ color: 'var(--text-primary)', fontSize: 18 }}>
            {isSetup ? 'Giriş Yap' : 'İlk Kurulum'}
          </h2>

          {!isSetup && (
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Admin hesabı oluşturun
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSetup ? 'current-password' : 'new-password'}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                placeholder="••••••••"
              />
            </div>

            {!isSetup && (
              <div>
                <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Şifre Tekrar
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-center rounded-xl py-2" style={{ background: 'rgba(220,50,50,0.1)', color: '#ff6b6b' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-semibold text-sm tracking-wider uppercase transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                color: '#0D0D0D',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '...' : isSetup ? 'Giriş Yap' : 'Hesap Oluştur'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
