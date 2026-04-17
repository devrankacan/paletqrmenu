'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type Category = { id: number; name: string; slug: string; icon: string };
type Product = {
  id: number; name: string; description: string; price: number;
  image_url: string; is_featured: number; is_available: number;
  category_id: number; category_name: string;
};
type Settings = Record<string, string>;

const INPUT_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

export default function AdminDashboard({
  categories, products, settings, username,
}: {
  categories: Category[]; products: Product[]; settings: Settings; username: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');
  const [filterCat, setFilterCat] = useState<number | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [msg, setMsg] = useState('');

  // Form state
  const emptyForm = { name: '', description: '', price: '', image_url: '', category_id: String(categories[0]?.id || ''), is_featured: false };
  const [form, setForm] = useState(emptyForm);

  // Settings form
  const [sForm, setSForm] = useState({
    restaurant_name: settings.restaurant_name || '',
    restaurant_subtitle: settings.restaurant_subtitle || '',
    currency: settings.currency || '₺',
  });

  const refresh = () => startTransition(() => { router.refresh(); });

  const showMsg = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleLogout = async () => {
    await fetch(apiUrl('/api/auth'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.push('/admin/login');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), is_featured: form.is_featured ? 1 : 0 }),
    });
    if (res.ok) {
      setForm(emptyForm);
      setShowAdd(false);
      showMsg('Ürün eklendi ✓');
      refresh();
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    await fetch(apiUrl(`/api/products/${editProduct.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), is_featured: form.is_featured ? 1 : 0, category_id: Number(form.category_id) }),
    });
    setEditProduct(null);
    setForm(emptyForm);
    showMsg('Ürün güncellendi ✓');
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    await fetch(apiUrl(`/api/products/${id}`), { method: 'DELETE' });
    showMsg('Ürün silindi');
    refresh();
  };

  const toggleAvailable = async (p: Product) => {
    await fetch(apiUrl(`/api/products/${p.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: p.is_available ? 0 : 1 }),
    });
    refresh();
  };

  const startEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description || '', price: String(p.price),
      image_url: p.image_url || '', category_id: String(p.category_id), is_featured: p.is_featured === 1,
    });
    setEditProduct(p);
    setShowAdd(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(apiUrl('/api/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sForm),
    });
    showMsg('Ayarlar kaydedildi ✓');
    refresh();
  };

  const filtered = filterCat === 'all' ? products : products.filter((p) => p.category_id === filterCat);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── TOP BAR ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 header-blur"
        style={{ background: 'rgba(13,13,13,0.95)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--gold)', fontSize: 16 }}>✦</span>
          <span className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)', fontSize: 16 }}>
            Palet Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{username}</span>
          <a
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.2)' }}
          >
            Menüyü Gör
          </a>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* ── TOAST ── */}
      {msg && (
        <div
          className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-medium shadow-xl"
          style={{
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            color: '#0D0D0D',
          }}
        >
          {msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ── TABS ── */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
          {(['products', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                activeTab === tab
                  ? { background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {tab === 'products' ? `Ürünler (${products.length})` : 'Ayarlar'}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div>
            {/* Filter + Add */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setFilterCat('all')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={filterCat === 'all'
                    ? { background: 'var(--gold)', color: '#0D0D0D' }
                    : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Tümü
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCat(c.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                    style={filterCat === c.id
                      ? { background: 'var(--gold)', color: '#0D0D0D' }
                      : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setShowAdd(!showAdd); setEditProduct(null); setForm(emptyForm); }}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: showAdd ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                  color: showAdd ? 'var(--text-secondary)' : '#0D0D0D',
                  border: showAdd ? '1px solid var(--border)' : 'none',
                }}
              >
                {showAdd ? '✕ İptal' : '+ Ürün Ekle'}
              </button>
            </div>

            {/* Add / Edit Form */}
            {(showAdd || editProduct) && (
              <form
                onSubmit={editProduct ? handleEditProduct : handleAddProduct}
                className="rounded-2xl p-5 mb-5"
                style={{ background: 'var(--surface)', border: '1px solid rgba(201,169,110,0.25)' }}
              >
                <h3 className="font-semibold mb-4" style={{ color: 'var(--gold)', fontSize: 15 }}>
                  {editProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                </h3>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Ürün Adı *</label>
                      <input style={INPUT_STYLE} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Menemen" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Fiyat *</label>
                      <input style={INPUT_STYLE} type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Kategori *</label>
                      <select
                        style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Açıklama</label>
                      <textarea
                        style={{ ...INPUT_STYLE, resize: 'none', height: 72 }}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Ürün açıklaması..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Görsel URL</label>
                      <input style={INPUT_STYLE} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                          className="relative rounded-full transition-all"
                          style={{
                            width: 40, height: 22,
                            background: form.is_featured ? 'var(--gold)' : 'var(--border)',
                          }}
                        >
                          <div
                            className="absolute top-1 rounded-full transition-all"
                            style={{
                              width: 14, height: 14, background: '#fff',
                              left: form.is_featured ? 22 : 4,
                            }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Öne Çıkan ürün</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}
                  >
                    {editProduct ? 'Güncelle' : 'Ekle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAdd(false); setEditProduct(null); setForm(emptyForm); }}
                    className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}

            {/* Product List */}
            <div className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div
                  className="text-center py-16 rounded-2xl"
                  style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}
                >
                  <p className="text-sm">Henüz ürün yok</p>
                  <p className="text-xs mt-1">Yukarıdan ürün ekleyin</p>
                </div>
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl p-3 transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      opacity: p.is_available ? 1 : 0.5,
                    }}
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                        style={{ background: 'var(--surface-2)' }}>
                        {categories.find((c) => c.id === p.category_id)?.icon || '🍽️'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        {p.is_featured === 1 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)', fontSize: 9 }}>★</span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.category_name}</p>
                    </div>
                    <span className="font-bold flex-shrink-0" style={{ color: 'var(--gold)', fontSize: 15 }}>
                      ₺{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleAvailable(p)}
                        title={p.is_available ? 'Gizle' : 'Göster'}
                        className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
                        style={{ background: 'var(--surface-2)', color: p.is_available ? '#4ade80' : 'var(--text-secondary)' }}
                      >
                        {p.is_available ? '👁' : '🚫'}
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
                        style={{ background: 'var(--surface-2)', color: 'var(--gold)' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
                        style={{ background: 'var(--surface-2)', color: '#ff6b6b' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold mb-5" style={{ color: 'var(--gold)', fontSize: 15 }}>
                Restoran Bilgileri
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Restoran Adı</label>
                  <input style={INPUT_STYLE} value={sForm.restaurant_name} onChange={(e) => setSForm({ ...sForm, restaurant_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Alt Başlık</label>
                  <input style={INPUT_STYLE} value={sForm.restaurant_subtitle} onChange={(e) => setSForm({ ...sForm, restaurant_subtitle: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Para Birimi Sembolü</label>
                  <input style={INPUT_STYLE} value={sForm.currency} onChange={(e) => setSForm({ ...sForm, currency: e.target.value })} placeholder="₺" />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}
            >
              Kaydet
            </button>
          </form>
        )}
      </div>
      {isPending && (
        <div className="fixed bottom-6 right-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Yenileniyor...
        </div>
      )}
    </div>
  );
}
