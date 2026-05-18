#!/usr/bin/env python3
"""
Diğer tüm şubeleri Merkez ile birebir aynı yapar.
- Merkez'de olmayan kategoriler silinir
- Merkez'deki tüm kategoriler ve ürünler kopyalanır
"""
import sqlite3
import re

DB_PATH = '/var/www/paletpastanesi/data/menu.db'

def make_slug(name):
    s = name.lower()
    s = s.replace('ı','i').replace('ğ','g').replace('ü','u').replace('ş','s').replace('ö','o').replace('ç','c')
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT id, slug FROM branches WHERE slug LIKE '%merkez%'")
merkez = c.fetchone()
if not merkez:
    raise SystemExit("Merkez şubesi bulunamadı")

merkez_id = merkez['id']
print(f"Merkez: id={merkez_id}, slug={merkez['slug']}")

c.execute("SELECT id, slug FROM branches WHERE id != ?", (merkez_id,))
other_branches = c.fetchall()
print(f"Diğer şubeler: {[b['slug'] for b in other_branches]}\n")

# Merkez'deki tüm kategorileri al
c.execute("SELECT * FROM categories WHERE branch_id = ? ORDER BY sort_order", (merkez_id,))
merkez_cats = c.fetchall()
merkez_cat_names = {cat['name'] for cat in merkez_cats}
print(f"Merkez'de {len(merkez_cats)} kategori var.\n")

for branch in other_branches:
    branch_id = branch['id']
    slug = branch['slug']
    print(f"=== {slug} ===")

    # Bu şubedeki kategorileri al
    c.execute("SELECT * FROM categories WHERE branch_id = ?", (branch_id,))
    existing_cats = c.fetchall()

    # Merkez'de olmayan kategorileri sil (ürünleriyle birlikte)
    for cat in existing_cats:
        if cat['name'] not in merkez_cat_names:
            c.execute("DELETE FROM products WHERE category_id = ?", (cat['id'],))
            c.execute("DELETE FROM categories WHERE id = ?", (cat['id'],))
            print(f"  Silindi: '{cat['name']}'")

    # Şubedeki güncel kategori listesini yenile
    c.execute("SELECT * FROM categories WHERE branch_id = ?", (branch_id,))
    existing_cats = {cat['name']: cat for cat in c.fetchall()}

    # Merkez kategorilerini sıraya göre işle
    for mcat in merkez_cats:
        cat_name = mcat['name']

        if cat_name in existing_cats:
            target_cat_id = existing_cats[cat_name]['id']
            c.execute("""
                UPDATE categories SET cover_url=?, icon=?, sort_order=? WHERE id=?
            """, (mcat['cover_url'], mcat['icon'], mcat['sort_order'], target_cat_id))
        else:
            base_slug = make_slug(cat_name)
            unique_slug = f"{base_slug}-{branch_id}"
            c.execute("""
                INSERT INTO categories (branch_id, name, slug, icon, sort_order, cover_url)
                VALUES (?,?,?,?,?,?)
            """, (branch_id, cat_name, unique_slug, mcat['icon'], mcat['sort_order'], mcat['cover_url']))
            target_cat_id = c.lastrowid
            print(f"  Eklendi kategori: '{cat_name}'")

        # Ürünleri sil ve Merkez'den yeniden ekle
        c.execute("DELETE FROM products WHERE category_id = ?", (target_cat_id,))
        c.execute("SELECT * FROM products WHERE category_id = ? ORDER BY sort_order", (mcat['id'],))
        merkez_prods = c.fetchall()
        for mp in merkez_prods:
            c.execute("""
                INSERT INTO products (category_id, name, description, price, image_url, sort_order)
                VALUES (?,?,?,?,?,?)
            """, (target_cat_id, mp['name'], mp['description'], mp['price'], mp['image_url'], mp['sort_order']))

        print(f"  '{cat_name}': {len(merkez_prods)} ürün yazıldı")

    print()

conn.commit()
conn.close()
print("Tamamlandı.")
