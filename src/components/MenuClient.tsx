'use client';

import { useState, useEffect, useRef } from 'react';

type Product = {
  id: number; name: string; description: string; price: number;
  image_url: string; is_featured: number; is_available: number;
};

type Category = {
  id: number; name: string; slug: string; icon: string; sort_order: number;
  products: Product[];
};

type Settings = Record<string, string>;

type BranchInfo = { name?: string; address?: string; phone?: string; working_hours?: string; wifi_password?: string; logo_url?: string; cover_url?: string };

export default function MenuClient({ menuData, settings, branch }: { menuData: Category[]; settings: Settings; branch?: BranchInfo }) {
  const [activeId, setActiveId] = useState<number>(menuData[0]?.id ?? 0);
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);
  const name = settings.restaurant_name || 'Palet';
  const subtitle = settings.restaurant_subtitle || 'Lezzet Sanatı';
  const currency = settings.currency || '₺';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);

      // Update active category based on scroll position
      let current = menuData[0]?.id;
      for (const cat of menuData) {
        const el = sectionRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = cat.id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuData]);

  // Scroll nav to active button
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector<HTMLElement>('.cat-btn.active');
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const navWidth = nav.offsetWidth;
      nav.scrollTo({ left: btnLeft - navWidth / 2 + btnWidth / 2, behavior: 'smooth' });
    }
  }, [activeId]);

  const scrollToCategory = (id: number) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 110;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const totalProducts = menuData.reduce((acc, c) => acc + c.products.length, 0);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ─── HEADER ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 header-blur transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-6'
        }`}
        style={{
          background: scrolled ? 'rgba(13,13,13,0.92)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(201,169,110,0.15)' : 'none',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center">
          {!scrolled && (
            <div className="text-center fade-up">
              {branch?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branch.logo_url} alt={name} className="mx-auto mb-1 object-contain" style={{ maxHeight: 72, maxWidth: 200 }} />
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span style={{ height: 1, width: 40, background: 'linear-gradient(to right, transparent, var(--gold))' }} />
                    <span style={{ color: 'var(--gold)', fontSize: 18 }}>✦</span>
                    <span style={{ height: 1, width: 40, background: 'linear-gradient(to left, transparent, var(--gold))' }} />
                  </div>
                  <h1
                    className="font-bold tracking-[0.15em] uppercase"
                    style={{ color: 'var(--text-primary)', fontSize: 28, letterSpacing: '0.2em' }}
                  >
                    {name}
                  </h1>
                  <p style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.25em', marginTop: 4 }}>
                    {subtitle.toUpperCase()}
                  </p>
                </>
              )}
            </div>
          )}
          {scrolled && (
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦</span>
              <span className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)', fontSize: 16 }}>
                {name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ─── HERO ─── */}
      {branch?.cover_url ? (
        <div className="relative" style={{ paddingTop: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branch.cover_url} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />
        </div>
      ) : (
        <div
          className="relative flex flex-col items-center justify-center text-center"
          style={{
            paddingTop: 140,
            paddingBottom: 40,
            background: 'linear-gradient(to bottom, rgba(201,169,110,0.06) 0%, transparent 100%)',
          }}
        >
          <div className="gold-divider w-24 mb-6" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, letterSpacing: '0.15em' }}>
            {totalProducts} LEZZET · {menuData.length} KATEGORİ
          </p>
          <div className="gold-divider w-24 mt-6" />
        </div>
      )}

      {/* ─── CATEGORY NAV ─── */}
      <div
        className="sticky z-40"
        style={{ top: scrolled ? 56 : 0, background: 'rgba(13,13,13,0.95)', borderBottom: '1px solid var(--border)' }}
      >
        <div
          ref={navRef}
          className="flex gap-1 overflow-x-auto px-4 py-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {menuData.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`cat-btn flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeId === cat.id
                  ? 'active border-b-2'
                  : 'border-transparent'
              }`}
              style={{
                color: activeId === cat.id ? 'var(--gold)' : 'var(--text-secondary)',
                borderBottomColor: activeId === cat.id ? 'var(--gold)' : 'transparent',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── MENU SECTIONS ─── */}
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-8">
        {menuData.map((cat, catIdx) => (
          <section
            key={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
            className="mb-14"
            style={{ animationDelay: `${catIdx * 0.05}s` }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex items-center justify-center rounded-xl text-2xl"
                style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05))',
                  border: '1px solid rgba(201,169,110,0.2)',
                }}
              >
                {cat.icon}
              </div>
              <div>
                <h2
                  className="font-bold tracking-wide uppercase"
                  style={{ color: 'var(--text-primary)', fontSize: 18, letterSpacing: '0.1em' }}
                >
                  {cat.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {cat.products.length} ürün
                </p>
              </div>
            </div>

            <div className="gold-divider mb-6" />

            {/* Products */}
            {cat.products.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}
              >
                <p className="text-sm">Henüz ürün eklenmedi</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cat.products.map((product) => (
                  <ProductCard key={product.id} product={product} currency={currency} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="text-center pb-10 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span style={{ height: 1, width: 30, background: 'linear-gradient(to right, transparent, var(--gold))' }} />
          <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦</span>
          <span style={{ height: 1, width: 30, background: 'linear-gradient(to left, transparent, var(--gold))' }} />
        </div>
        <p className="font-bold tracking-widest uppercase" style={{ color: 'var(--gold)', fontSize: 14 }}>
          {name}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
          Dijital Menü
        </p>

        {branch && (branch.address || branch.phone || branch.working_hours || branch.wifi_password) && (
          <div className="mt-6 mx-auto max-w-xs flex flex-col gap-2">
            {branch.address && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📍 {branch.address}</p>
            )}
            {branch.phone && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📞 {branch.phone}</p>
            )}
            {branch.working_hours && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>🕐 {branch.working_hours}</p>
            )}
            {branch.wifi_password && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📶 Wifi: {branch.wifi_password}</p>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const hasImage = product.image_url && product.image_url.trim() !== '';

  return (
    <div
      className="product-card rounded-2xl overflow-hidden flex"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Image */}
      {hasImage && (
        <div className="flex-shrink-0" style={{ width: 100, height: 100 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {product.is_featured === 1 && (
                <span
                  className="badge-pulse flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(201,169,110,0.15)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(201,169,110,0.3)',
                    fontSize: 10,
                  }}
                >
                  ★ ÖNE ÇIKAN
                </span>
              )}
            </div>
          </div>
          <h3
            className="font-semibold leading-snug mt-1"
            style={{ color: 'var(--text-primary)', fontSize: 15 }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p
              className="mt-1 leading-relaxed line-clamp-2"
              style={{ color: 'var(--text-secondary)', fontSize: 12 }}
            >
              {product.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <span
            className="font-bold"
            style={{ color: 'var(--gold)', fontSize: 18 }}
          >
            {currency}{product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
