'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type Branch = { id: number; name: string; slug: string; address: string; phone: string; working_hours: string; wifi_password: string };
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

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminDashboard({
  initialBranches, settings, username,
}: {
  initialBranches: Branch[]; settings: Settings; username: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'branches' | 'products' | 'categories' | 'settings'>('branches');
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [msg, setMsg] = useState('');

  // Branch form
  const [branchForm, setBranchForm] = useState({ name: '', slug: '' });
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [branchSettingsForm, setBranchSettingsForm] = useState({ name: '', address: '', phone: '', working_hours: '', wifi_password: '', logo_url: '' });

  // Product form
  const emptyProduct = { name: '', description: '', price: '', image_url: '', category_id: '', is_featured: false };
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [filterCat, setFilterCat] = useState<number | 'all'>('all');

  // Category form
  const [catForm, setCatForm] = useState({ name: '', icon: '🍽️' });
  const [showAddCat, setShowAddCat] = useState(false);

  // Settings form
  const [sForm, setSForm] = useState({
    restaurant_name: settings.restaurant_name || '',
    restaurant_subtitle: settings.restaurant_subtitle || '',
    currency: settings.currency || '₺',
  });

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const fetchBranchData = async (branchId: number) => {
    const [cR, pR] = await Promise.all([
      fetch(apiUrl(`/api/categories?branch_id=${branchId}`)),
      fetch(apiUrl(`/api/products?branch_id=${branchId}`)),
    ]);
    const [cats, prods] = await Promise.all([cR.json(), pR.json()]);
    setCategories(cats);
    setProducts(prods);
  };

  useEffect(() => {
    if (selectedBranch) fetchBranchData(selectedBranch.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch?.id]);

  const selectBranch = (b: Branch) => {
    setSelectedBranch(b);
    setBranchSettingsForm({ name: b.name, address: b.address || '', phone: b.phone || '', working_hours: b.working_hours || '', wifi_password: b.wifi_password || '', logo_url: (b as Branch & { logo_url?: string }).logo_url || '' });
    setActiveTab('products');
  };

  const handleLogout = async () => {
    await fetch(apiUrl('/api/auth'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.push('/admin/login');
  };

  // ── Branch CRUD ──
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(apiUrl('/api/branches'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchForm),
    });
    const data = await res.json();
    if (res.ok) {
      const newBranch: Branch = { id: data.id, ...branchForm, address: '', phone: '', working_hours: '', wifi_password: '' };
      setBranches([...branches, newBranch]);
      setBranchForm({ name: '', slug: '' });
      showMsg('Şube eklendi ✓');
    } else {
      showMsg(data.error || 'Hata');
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('Bu şubeyi silmek istediğinizden emin misiniz? Tüm kategoriler ve ürünler silinecek.')) return;
    await fetch(apiUrl(`/api/branches/${id}`), { method: 'DELETE' });
    setBranches(branches.filter((b) => b.id !== id));
    if (selectedBranch?.id === id) { setSelectedBranch(null); setActiveTab('branches'); }
    showMsg('Şube silindi');
  };

  const handleSaveBranchSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    await fetch(apiUrl(`/api/branches/${selectedBranch.id}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchSettingsForm),
    });
    const updated = { ...selectedBranch, ...branchSettingsForm };
    setBranches(branches.map((b) => b.id === selectedBranch.id ? updated : b));
    setSelectedBranch(updated);
    showMsg('Şube bilgileri kaydedildi ✓');
  };

  // ── Category CRUD ──
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    const res = await fetch(apiUrl('/api/categories'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...catForm, branch_id: selectedBranch.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories([...categories, { id: data.id, name: catForm.name, slug: '', icon: catForm.icon }]);
      setCatForm({ name: '', icon: '🍽️' });
      setShowAddCat(false);
      showMsg('Kategori eklendi ✓');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    await fetch(apiUrl(`/api/categories/${id}`), { method: 'DELETE' });
    setCategories(categories.filter((c) => c.id !== id));
    setProducts(products.filter((p) => p.category_id !== id));
    showMsg('Kategori silindi');
  };

  // ── Product CRUD ──
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productForm, price: Number(productForm.price), is_featured: productForm.is_featured ? 1 : 0 }),
    });
    if (res.ok) {
      setProductForm(emptyProduct);
      setShowAddProduct(false);
      if (selectedBranch) fetchBranchData(selectedBranch.id);
      showMsg('Ürün eklendi ✓');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    await fetch(apiUrl(`/api/products/${editProduct.id}`), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productForm, price: Number(productForm.price), is_featured: productForm.is_featured ? 1 : 0, category_id: Number(productForm.category_id) }),
    });
    setEditProduct(null);
    setProductForm(emptyProduct);
    if (selectedBranch) fetchBranchData(selectedBranch.id);
    showMsg('Ürün güncellendi ✓');
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    await fetch(apiUrl(`/api/products/${id}`), { method: 'DELETE' });
    setProducts(products.filter((p) => p.id !== id));
    showMsg('Ürün silindi');
  };

  const toggleAvailable = async (p: Product) => {
    await fetch(apiUrl(`/api/products/${p.id}`), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: p.is_available ? 0 : 1 }),
    });
    setProducts(products.map((x) => x.id === p.id ? { ...x, is_available: x.is_available ? 0 : 1 } : x));
  };

  const startEditProduct = (p: Product) => {
    setProductForm({ name: p.name, description: p.description || '', price: String(p.price), image_url: p.image_url || '', category_id: String(p.category_id), is_featured: p.is_featured === 1 });
    setEditProduct(p);
    setShowAddProduct(false);
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(apiUrl('/api/settings'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sForm) });
    startTransition(() => router.refresh());
    showMsg('Ayarlar kaydedildi ✓');
  };

  const filteredProducts = filterCat === 'all' ? products : products.filter((p) => p.category_id === filterCat);
  const ICONS = ['🍽️', '☕', '🍵', '🥤', '🍹', '🧃', '🍳', '🥗', '🍲', '🍕', '🍔', '🥩', '🍗', '🍰', '🎂', '🍮', '🍞', '🥐', '🍜', '🌮', '🍱', '🥙', '🍟', '🍫'];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(13,13,13,0.97)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--gold)', fontSize: 16 }}>✦</span>
          <span className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)', fontSize: 16 }}>Palet Admin</span>
          {selectedBranch && (
            <span className="px-2 py-0.5 rounded-lg text-xs" style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.2)' }}>
              {selectedBranch.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{username}</span>
          {selectedBranch && (
            <a href={apiUrl(`/${selectedBranch.slug}`)} target="_blank"
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,169,110,0.2)' }}>
              Menüyü Gör ↗
            </a>
          )}
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Çıkış
          </button>
        </div>
      </header>

      {/* TOAST */}
      {msg && (
        <div className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-medium shadow-xl"
          style={{ transform: 'translateX(-50%)', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
          {msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* TABS */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveTab('branches')}
            className="flex-shrink-0 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={activeTab === 'branches' ? { background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' } : { color: 'var(--text-secondary)' }}>
            Şubeler ({branches.length})
          </button>
          {selectedBranch && (<>
            <button onClick={() => setActiveTab('products')}
              className="flex-shrink-0 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeTab === 'products' ? { background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' } : { color: 'var(--text-secondary)' }}>
              Ürünler
            </button>
            <button onClick={() => setActiveTab('categories')}
              className="flex-shrink-0 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeTab === 'categories' ? { background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' } : { color: 'var(--text-secondary)' }}>
              Kategoriler
            </button>
            <button onClick={() => setActiveTab('settings')}
              className="flex-shrink-0 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeTab === 'settings' ? { background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' } : { color: 'var(--text-secondary)' }}>
              Ayarlar
            </button>
          </>)}
        </div>

        {/* ── ŞUBELER TAB ── */}
        {activeTab === 'branches' && (
          <div className="flex flex-col gap-4">
            {/* Add branch form */}
            <form onSubmit={handleAddBranch} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid rgba(201,169,110,0.25)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--gold)', fontSize: 15 }}>Yeni Şube Ekle</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Şube Adı *</label>
                  <input style={INPUT_STYLE} value={branchForm.name} required placeholder="Merkez Şube"
                    onChange={(e) => setBranchForm({ name: e.target.value, slug: slugify(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>URL Slug *</label>
                  <input style={INPUT_STYLE} value={branchForm.slug} required placeholder="merkez"
                    onChange={(e) => setBranchForm({ ...branchForm, slug: e.target.value })} />
                  {branchForm.slug && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Menü linki: {apiUrl(`/${branchForm.slug}`)}
                    </p>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
                Şube Ekle
              </button>
            </form>

            {/* Branch list */}
            {branches.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                <p className="text-sm">Henüz şube eklenmedi</p>
              </div>
            ) : (
              branches.map((b) => (
                <div key={b.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--surface)', border: `1px solid ${selectedBranch?.id === b.id ? 'var(--gold)' : 'var(--border)'}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{apiUrl(`/${b.slug}`)}</p>
                  </div>
                  <button onClick={() => selectBranch(b)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                    style={{ background: selectedBranch?.id === b.id ? 'var(--gold)' : 'rgba(201,169,110,0.15)', color: selectedBranch?.id === b.id ? '#0D0D0D' : 'var(--gold)', border: '1px solid rgba(201,169,110,0.3)' }}>
                    {selectedBranch?.id === b.id ? 'Seçili' : 'Yönet'}
                  </button>
                  <button onClick={() => handleDeleteBranch(b.id)}
                    className="w-8 h-8 rounded-lg text-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', color: '#ff6b6b' }}>
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ÜRÜNLER TAB ── */}
        {activeTab === 'products' && selectedBranch && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => setFilterCat('all')} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={filterCat === 'all' ? { background: 'var(--gold)', color: '#0D0D0D' } : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  Tümü
                </button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => setFilterCat(c.id)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                    style={filterCat === c.id ? { background: 'var(--gold)', color: '#0D0D0D' } : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
              <label className="flex-shrink-0 cursor-pointer px-3 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                title="CSV ile toplu içe aktar">
                📥 CSV
                <input type="file" accept=".csv,text/csv" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedBranch) return;
                    e.target.value = '';
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch(apiUrl(`/api/import?branch_id=${selectedBranch.id}`), { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok) {
                      const errDetail = data.errors?.length ? ` | İlk hata: ${data.errors[0]}` : '';
                      showMsg(`${data.imported} ürün aktarıldı${data.errors?.length ? ` (${data.errors.length} hata${errDetail})` : ' ✓'}`);
                      if (data.imported > 0) fetchBranchData(selectedBranch.id);
                    } else {
                      showMsg(data.error || 'İçe aktarma hatası');
                    }
                  }} />
              </label>
              <button onClick={() => { setShowAddProduct(!showAddProduct); setEditProduct(null); setProductForm(emptyProduct); }}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: showAddProduct ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: showAddProduct ? 'var(--text-secondary)' : '#0D0D0D', border: showAddProduct ? '1px solid var(--border)' : 'none' }}>
                {showAddProduct ? '✕ İptal' : '+ Ürün Ekle'}
              </button>
            </div>

            {(showAddProduct || editProduct) && (
              <form onSubmit={editProduct ? handleEditProduct : handleAddProduct}
                className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid rgba(201,169,110,0.25)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--gold)', fontSize: 15 }}>
                  {editProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                </h3>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Ürün Adı *</label>
                    <input style={INPUT_STYLE} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required placeholder="Menemen" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Fiyat *</label>
                      <input style={INPUT_STYLE} type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Kategori *</label>
                      <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required>
                        <option value="">Seçin</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Açıklama</label>
                    <textarea style={{ ...INPUT_STYLE, resize: 'none', height: 72 }} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Ürün açıklaması..." />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Görsel URL</label>
                    <input style={INPUT_STYLE} value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setProductForm({ ...productForm, is_featured: !productForm.is_featured })}
                      className="relative rounded-full transition-all" style={{ width: 40, height: 22, background: productForm.is_featured ? 'var(--gold)' : 'var(--border)' }}>
                      <div className="absolute top-1 rounded-full transition-all"
                        style={{ width: 14, height: 14, background: '#fff', left: productForm.is_featured ? 22 : 4 }} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Öne Çıkan</span>
                  </label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
                    {editProduct ? 'Güncelle' : 'Ekle'}
                  </button>
                  <button type="button" onClick={() => { setShowAddProduct(false); setEditProduct(null); setProductForm(emptyProduct); }}
                    className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    İptal
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                  <p className="text-sm">Henüz ürün yok</p>
                  {categories.length === 0 && <p className="text-xs mt-1">Önce Kategoriler sekmesinden kategori ekleyin</p>}
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: p.is_available ? 1 : 0.5 }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-lg" style={{ background: 'var(--surface-2)' }}>
                        {categories.find((c) => c.id === p.category_id)?.icon || '🍽️'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.category_name}</p>
                    </div>
                    <span className="font-bold flex-shrink-0" style={{ color: 'var(--gold)', fontSize: 15 }}>
                      ₺{p.price % 1 === 0 ? p.price.toFixed(0) : p.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleAvailable(p)} className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'var(--surface-2)', color: p.is_available ? '#4ade80' : 'var(--text-secondary)' }}>
                        {p.is_available ? '👁' : '🚫'}
                      </button>
                      <button onClick={() => startEditProduct(p)} className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'var(--surface-2)', color: 'var(--gold)' }}>✏️</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'var(--surface-2)', color: '#ff6b6b' }}>🗑</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── KATEGORİLER TAB ── */}
        {activeTab === 'categories' && selectedBranch && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setShowAddCat(!showAddCat)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: showAddCat ? 'var(--surface)' : 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: showAddCat ? 'var(--text-secondary)' : '#0D0D0D', border: showAddCat ? '1px solid var(--border)' : 'none' }}>
              {showAddCat ? '✕ İptal' : '+ Kategori Ekle'}
            </button>

            {showAddCat && (
              <form onSubmit={handleAddCategory} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid rgba(201,169,110,0.25)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--gold)', fontSize: 15 }}>Yeni Kategori</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Kategori Adı *</label>
                    <input style={INPUT_STYLE} value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required placeholder="Kahvaltılıklar" />
                  </div>
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>İkon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map((icon) => (
                        <button key={icon} type="button" onClick={() => setCatForm({ ...catForm, icon })}
                          className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                          style={{ background: catForm.icon === icon ? 'rgba(201,169,110,0.25)' : 'var(--surface-2)', border: catForm.icon === icon ? '2px solid var(--gold)' : '2px solid transparent' }}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
                  Kategori Ekle
                </button>
              </form>
            )}

            {categories.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                <p className="text-sm">Bu şube için henüz kategori yok</p>
              </div>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-2xl">{c.icon}</span>
                  <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  <button onClick={() => handleDeleteCategory(c.id)} className="w-8 h-8 rounded-lg text-sm flex items-center justify-center"
                    style={{ background: 'var(--surface-2)', color: '#ff6b6b' }}>🗑</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── AYARLAR TAB ── */}
        {activeTab === 'settings' && selectedBranch && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSaveBranchSettings} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold mb-5" style={{ color: 'var(--gold)', fontSize: 15 }}>Şube Bilgileri — {selectedBranch.name}</h3>
              <div className="flex flex-col gap-4">
                {[
                  { key: 'name', label: 'Şube Adı', placeholder: 'Merkez Şube' },
                  { key: 'address', label: 'Adres', placeholder: 'İstanbul, Türkiye' },
                  { key: 'phone', label: 'Telefon', placeholder: '0212 000 00 00' },
                  { key: 'working_hours', label: 'Çalışma Saatleri', placeholder: '09:00 - 22:00' },
                  { key: 'wifi_password', label: 'Wifi Şifresi', placeholder: 'wifi123' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                    <input style={INPUT_STYLE} value={branchSettingsForm[key as keyof typeof branchSettingsForm]}
                      onChange={(e) => setBranchSettingsForm({ ...branchSettingsForm, [key]: e.target.value })}
                      placeholder={placeholder} />
                  </div>
                ))}

                {/* Logo upload */}
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Şube Logosu</label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--gold)', fontSize: 20 }}>📁</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Görsel seç (JPG, PNG, SVG — max 5MB)</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
                        const data = await res.json();
                        if (res.ok) setBranchSettingsForm((f) => ({ ...f, logo_url: data.url }));
                        else showMsg(data.error || 'Yükleme hatası');
                      }} />
                  </label>
                  {branchSettingsForm.logo_url && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branchSettingsForm.logo_url} alt="Logo" className="h-14 object-contain rounded-xl" style={{ background: 'var(--surface-2)', padding: 4 }} />
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface-2)', color: '#ff6b6b', border: '1px solid var(--border)' }}
                        onClick={() => setBranchSettingsForm((f) => ({ ...f, logo_url: '' }))}>
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full mt-5 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
                Kaydet
              </button>
            </form>

            <form onSubmit={handleSaveGlobalSettings} className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold mb-5" style={{ color: 'var(--gold)', fontSize: 15 }}>Genel Ayarlar</h3>
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
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Para Birimi</label>
                  <input style={INPUT_STYLE} value={sForm.currency} onChange={(e) => setSForm({ ...sForm, currency: e.target.value })} placeholder="₺" />
                </div>
              </div>
              <button type="submit" className="w-full mt-5 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: '#0D0D0D' }}>
                Kaydet
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
