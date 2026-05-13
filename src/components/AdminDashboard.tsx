'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type Branch = { id: number; name: string; slug: string; address: string; phone: string; working_hours: string; wifi_password: string };
type Category = { id: number; name: string; slug: string; icon: string; cover_url?: string };
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
  const [branchSettingsForm, setBranchSettingsForm] = useState({ name: '', address: '', phone: '', working_hours: '', wifi_password: '', logo_url: '', cover_url: '', theme: 'classic', instagram: '', contact_email: '' });

  // Product form
  const emptyProduct = { name: '', description: '', price: '', image_url: '', category_id: '', is_featured: false };
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [filterCat, setFilterCat] = useState<number | 'all'>('all');

  // Category form
  const [catForm, setCatForm] = useState({ name: '', cover_url: '' });
  const [showAddCat, setShowAddCat] = useState(false);

  // Category edit
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const handleSaveCatName = async (id: number) => {
    const name = editCatName.trim();
    if (!name) { setEditCatId(null); return; }
    await fetch(apiUrl(`/api/categories/${id}`), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setCategories(categories.map((c) => c.id === id ? { ...c, name } : c));
    setEditCatId(null);
    showMsg('Kategori adı güncellendi ✓');
  };

  // Settings form
  const [sForm, setSForm] = useState({
    restaurant_name: settings.restaurant_name || '',
    restaurant_subtitle: settings.restaurant_subtitle || '',
    currency: settings.currency || '₺',
  });

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleCatDrop = async (dropIndex: number) => {
    const from = dragIndex.current;
    if (from === null || from === dropIndex) { setDragOver(null); return; }
    const reordered = [...categories];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, sort_order: i }));
    setCategories(updated);
    setDragOver(null);
    dragIndex.current = null;
    await Promise.all(updated.map((c) =>
      fetch(apiUrl(`/api/categories/${c.id}`), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: c.sort_order }),
      })
    ));
  };

  const prodDragIndex = useRef<number | null>(null);
  const [prodDragOver, setProdDragOver] = useState<number | null>(null);

  const catScrollRef = useRef<HTMLDivElement>(null);
  const catScrollDrag = useRef({ down: false, startX: 0, scrollLeft: 0 });

  const onCatMouseDown = (e: React.MouseEvent) => {
    const el = catScrollRef.current;
    if (!el) return;
    catScrollDrag.current = { down: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
  };
  const onCatMouseMove = (e: React.MouseEvent) => {
    const d = catScrollDrag.current;
    if (!d.down) return;
    e.preventDefault();
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollLeft = d.scrollLeft - (e.pageX - el.offsetLeft - d.startX);
  };
  const onCatMouseUp = () => {
    catScrollDrag.current.down = false;
    if (catScrollRef.current) catScrollRef.current.style.cursor = 'grab';
  };

  const handleProductDrop = async (dropIndex: number) => {
    const from = prodDragIndex.current;
    if (from === null || from === dropIndex) { setProdDragOver(null); return; }
    const reordered = [...filteredProducts];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }));
    const otherProducts = products.filter((p) => !updated.find((u) => u.id === p.id));
    setProducts([...otherProducts, ...updated]);
    setProdDragOver(null);
    prodDragIndex.current = null;
    await Promise.all(updated.map((p) =>
      fetch(apiUrl(`/api/products/${p.id}`), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: p.sort_order }),
      })
    ));
  };

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
    const bb = b as Branch & { logo_url?: string; cover_url?: string; theme?: string; instagram?: string; contact_email?: string };
    setBranchSettingsForm({ name: b.name, address: b.address || '', phone: b.phone || '', working_hours: b.working_hours || '', wifi_password: b.wifi_password || '', logo_url: bb.logo_url || '', cover_url: bb.cover_url || '', theme: bb.theme || 'classic', instagram: bb.instagram || '', contact_email: bb.contact_email || '' });
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
      body: JSON.stringify({ name: catForm.name, cover_url: catForm.cover_url, branch_id: selectedBranch.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories([...categories, { id: data.id, name: catForm.name, slug: '', icon: '🍽️', cover_url: catForm.cover_url }]);
      setCatForm({ name: '', cover_url: '' });
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
              <div ref={catScrollRef} className="flex gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none', cursor: 'grab', userSelect: 'none' }}
                onMouseDown={onCatMouseDown} onMouseMove={onCatMouseMove} onMouseUp={onCatMouseUp} onMouseLeave={onCatMouseUp}>
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
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Görsel</label>
                    <div className="flex gap-2">
                      <input style={{ ...INPUT_STYLE, flex: 1 }} value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="https://... veya bilgisayardan yükle" />
                      <label className="flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                        style={{ width: 42, height: 42, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--gold)', fontSize: 18 }} title="Bilgisayardan yükle">
                        🖼️
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = '';
                            const fd = new FormData();
                            fd.append('file', file);
                            showMsg('Yükleniyor...');
                            const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
                            const data = await res.json();
                            if (res.ok) { setProductForm((f) => ({ ...f, image_url: data.url })); showMsg('Görsel yüklendi ✓'); }
                            else showMsg(data.error || 'Yükleme hatası');
                          }} />
                      </label>
                    </div>
                    {productForm.image_url && (
                      <div className="mt-2 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={productForm.image_url} alt="Önizleme" className="rounded-xl object-cover flex-shrink-0" style={{ width: 64, height: 64 }} />
                        <button type="button" className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'var(--surface-2)', color: '#ff6b6b', border: '1px solid var(--border)' }}
                          onClick={() => setProductForm((f) => ({ ...f, image_url: '' }))}>
                          Kaldır
                        </button>
                      </div>
                    )}
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

            {filterCat !== 'all' && (
              <p className="text-xs text-center mb-1" style={{ color: 'var(--text-secondary)' }}>⠿ Sıralamak için sürükleyin</p>
            )}
            <div className="flex flex-col gap-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                  <p className="text-sm">Henüz ürün yok</p>
                  {categories.length === 0 && <p className="text-xs mt-1">Önce Kategoriler sekmesinden kategori ekleyin</p>}
                </div>
              ) : (
                filteredProducts.map((p, idx) => (
                  <div key={p.id}
                    draggable={filterCat !== 'all'}
                    onDragStart={() => { if (filterCat !== 'all') prodDragIndex.current = idx; }}
                    onDragOver={(e) => { if (filterCat !== 'all') { e.preventDefault(); setProdDragOver(idx); } }}
                    onDragLeave={() => setProdDragOver(null)}
                    onDrop={() => { if (filterCat !== 'all') handleProductDrop(idx); }}
                    onDragEnd={() => { prodDragIndex.current = null; setProdDragOver(null); }}
                    className="flex items-center gap-3 rounded-2xl p-3 transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${prodDragOver === idx && filterCat !== 'all' ? 'var(--gold)' : 'var(--border)'}`,
                      opacity: p.is_available ? 1 : 0.5,
                      cursor: filterCat !== 'all' ? 'grab' : 'default',
                    }}>
                    {filterCat !== 'all' && (
                      <span className="flex-shrink-0 select-none" style={{ color: 'var(--text-secondary)', fontSize: 16 }}>⠿</span>
                    )}
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img draggable={false} src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
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
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kapak Görseli</label>
                    <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3"
                      style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                      <span style={{ color: 'var(--gold)', fontSize: 18 }}>🖼️</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Görsel seç (JPG, PNG, HEIC — max 20MB)</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
                          const data = await res.json();
                          if (res.ok) setCatForm((f) => ({ ...f, cover_url: data.url }));
                          else showMsg(data.error || 'Yükleme hatası');
                        }} />
                    </label>
                    {catForm.cover_url && (
                      <div className="mt-2 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={catForm.cover_url} alt="Kapak" className="rounded-xl object-cover flex-shrink-0" style={{ width: 80, height: 50 }} />
                        <button type="button" className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'var(--surface-2)', color: '#ff6b6b', border: '1px solid var(--border)' }}
                          onClick={() => setCatForm((f) => ({ ...f, cover_url: '' }))}>
                          Kaldır
                        </button>
                      </div>
                    )}
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
              categories.map((c, idx) => (
                <div key={c.id}
                  draggable
                  onDragStart={() => { dragIndex.current = idx; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleCatDrop(idx)}
                  onDragEnd={() => { dragIndex.current = null; setDragOver(null); }}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${dragOver === idx ? 'var(--gold)' : 'var(--border)'}`,
                    opacity: dragIndex.current === idx ? 0.5 : 1,
                    cursor: 'grab',
                  }}>
                  <span className="flex-shrink-0 select-none" style={{ color: 'var(--text-secondary)', fontSize: 16, cursor: 'grab' }}>⠿</span>
                  {c.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_url} alt="" className="rounded-xl object-cover flex-shrink-0" style={{ width: 48, height: 48 }} />
                  ) : (
                    <div className="rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ width: 48, height: 48, background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 20 }}>🖼️</div>
                  )}
                  {editCatId === c.id ? (
                    <input
                      autoFocus
                      className="flex-1 font-medium rounded-lg px-2 py-1 text-sm"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--gold)', color: 'var(--text-primary)', outline: 'none' }}
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCatName(c.id); if (e.key === 'Escape') setEditCatId(null); }}
                      onBlur={() => handleSaveCatName(c.id)}
                    />
                  ) : (
                    <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  )}
                  <button onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}
                    className="w-8 h-8 rounded-lg text-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', color: 'var(--gold)' }} title="İsmi düzenle">✏️</button>
                  <label className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-2)', color: 'var(--gold)' }} title="Kapak görseli değiştir">
                    📷
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = '';
                        const fd = new FormData();
                        fd.append('file', file);
                        showMsg('Yükleniyor...');
                        const uploadRes = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
                        const uploadData = await uploadRes.json();
                        if (!uploadRes.ok) { showMsg(uploadData.error || 'Dosya yükleme hatası'); return; }
                        const patchRes = await fetch(apiUrl(`/api/categories/${c.id}`), {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ cover_url: uploadData.url }),
                        });
                        if (!patchRes.ok) {
                          const patchData = await patchRes.json();
                          showMsg(patchData.error || 'Kaydetme hatası — tekrar deneyin');
                          return;
                        }
                        if (selectedBranch) await fetchBranchData(selectedBranch.id);
                        showMsg('Kapak güncellendi ✓');
                      }} />
                  </label>
                  <button onClick={() => handleDeleteCategory(c.id)} className="w-8 h-8 rounded-lg text-sm flex items-center justify-center flex-shrink-0"
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
                  { key: 'instagram', label: 'Instagram', placeholder: '@hesap_adi' },
                  { key: 'contact_email', label: 'İletişim E-postası', placeholder: 'info@restoran.com' },
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
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Görsel seç (JPG, PNG, SVG, HEIC — max 20MB)</span>
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

                {/* Cover image upload */}
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Kapak Görseli</label>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>Ürünlerin üzerinde banner olarak gösterilir</p>
                  <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--gold)', fontSize: 20 }}>🖼️</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Görsel seç (JPG, PNG, HEIC — max 20MB)</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = '';
                        const fd = new FormData();
                        fd.append('file', file);
                        showMsg('Yükleniyor...');
                        try {
                          const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
                          const data = await res.json();
                          if (res.ok) { setBranchSettingsForm((f) => ({ ...f, cover_url: data.url })); showMsg('Görsel yüklendi ✓'); }
                          else showMsg(data.error || 'Yükleme hatası');
                        } catch { showMsg('Yükleme hatası — konsolu kontrol edin'); }
                      }} />
                  </label>
                  {branchSettingsForm.cover_url && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={branchSettingsForm.cover_url} alt="Kapak" className="rounded-xl object-cover" style={{ height: 80, width: 140 }} />
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface-2)', color: '#ff6b6b', border: '1px solid var(--border)' }}
                        onClick={() => setBranchSettingsForm((f) => ({ ...f, cover_url: '' }))}>
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme picker */}
                <div>
                  <label className="block text-xs mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Menü Görünümü</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      {
                        id: 'classic',
                        label: 'Klasik',
                        desc: 'Koyu zemin, altın vurgu',
                        preview: (
                          <div style={{ background: '#0d0d0d', height: 80, borderRadius: 8, overflow: 'hidden', padding: 6 }}>
                            <div style={{ background: '#1a1a1a', borderRadius: 5, padding: '4px 6px', marginBottom: 4 }}>
                              <div style={{ background: '#C9A96E', borderRadius: 3, height: 5, width: '60%' }} />
                            </div>
                            {[1, 2, 3].map((i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                <div style={{ background: '#1a1a1a', borderRadius: 4, width: 18, height: 18, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ background: '#2a2a2a', borderRadius: 2, height: 4, width: '70%', marginBottom: 2 }} />
                                  <div style={{ background: '#C9A96E', borderRadius: 2, height: 3, width: '30%' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        id: 'banner',
                        label: 'Banner',
                        desc: 'Sinematik koyu tema',
                        preview: (
                          <div style={{ background: '#0d0d0d', height: 80, borderRadius: 8, overflow: 'hidden', padding: 6 }}>
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '4px 6px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <div style={{ background: '#C9A96E', borderRadius: 2, height: 4, width: '40%' }} />
                            </div>
                            {[1, 2].map((i) => (
                              <div key={i} style={{ background: `linear-gradient(135deg, #1a1a2e, #16213e)`, borderRadius: 5, height: 22, marginBottom: 3, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 2, height: 4, width: '50%' }} />
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        id: 'grid',
                        label: 'Grid',
                        desc: 'Aydınlık kart görünümü',
                        preview: (
                          <div style={{ background: '#f5f5f7', height: 80, borderRadius: 8, overflow: 'hidden', padding: 6 }}>
                            <div style={{ background: '#fff', borderRadius: 5, padding: '3px 5px', marginBottom: 4 }}>
                              <div style={{ background: '#E53E3E', borderRadius: 2, height: 4, width: '45%' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                              {[1, 2, 3, 4].map((i) => (
                                <div key={i} style={{ background: '#fff', borderRadius: 5, overflow: 'hidden' }}>
                                  <div style={{ background: '#e8e8e8', height: 18 }} />
                                  <div style={{ padding: '2px 3px' }}>
                                    <div style={{ background: '#ddd', borderRadius: 2, height: 3, marginBottom: 2 }} />
                                    <div style={{ background: '#E53E3E', borderRadius: 2, height: 3, width: '50%' }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      },
                    ] as { id: string; label: string; desc: string; preview: React.ReactNode }[]).map((t) => (
                      <button key={t.id} type="button"
                        onClick={() => setBranchSettingsForm((f) => ({ ...f, theme: t.id }))}
                        className="rounded-xl overflow-hidden transition-all"
                        style={{ border: `2px solid ${branchSettingsForm.theme === t.id ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--surface-2)', padding: 0 }}>
                        <div style={{ padding: '6px 6px 0' }}>{t.preview}</div>
                        <div style={{ padding: '6px 6px 8px', textAlign: 'center' }}>
                          <p className="font-semibold" style={{ color: branchSettingsForm.theme === t.id ? 'var(--gold)' : 'var(--text-primary)', fontSize: 12 }}>{t.label}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
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
