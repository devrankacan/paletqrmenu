#!/usr/bin/env python3
"""
Merkez'deki 10 kategoriyi diğer tüm şubelere birebir kopyalar.
Hedef kategorideki tüm ürünleri silip Merkez'den yeniden ekler.
"""
import sqlite3

DB_PATH = '/var/www/paletpastanesi/data/menu.db'

TARGET_CATEGORIES = [
    'Pastalar', 'Cup Çeşitleri', 'Şerbetli Tatlılar', 'Özel Tatlılar',
    'Kruvasanlar', 'Unlu Mamüller', 'Atıştırmalıklar',
    'Soğuk İçecekler', 'Dondurmalar', 'Sıcak İçecekler'
]

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

for cat_name in TARGET_CATEGORIES:
    c.execute("SELECT * FROM categories WHERE branch_id = ? AND name = ?", (merkez_id, cat_name))
    merkez_cat = c.fetchone()
    if not merkez_cat:
        print(f"[ATLA] '{cat_name}' Merkez'de bulunamadı")
        continue

    c.execute("SELECT * FROM products WHERE category_id = ? ORDER BY sort_order", (merkez_cat['id'],))
    merkez_products = c.fetchall()
    print(f"'{cat_name}' — Merkez'de {len(merkez_products)} ürün")

    for branch in other_branches:
        branch_id = branch['id']
        slug = branch['slug']

        # Kategoriyi bul veya oluştur
        c.execute("SELECT id FROM categories WHERE branch_id = ? AND name = ?", (branch_id, cat_name))
        row = c.fetchone()
        if row:
            target_cat_id = row['id']
            c.execute("UPDATE categories SET cover_url=?, icon=?, sort_order=? WHERE id=?",
                      (merkez_cat['cover_url'], merkez_cat['icon'], merkez_cat['sort_order'], target_cat_id))
        else:
            c.execute("INSERT INTO categories (branch_id, name, icon, sort_order, cover_url) VALUES (?,?,?,?,?)",
                      (branch_id, cat_name, merkez_cat['icon'], merkez_cat['sort_order'], merkez_cat['cover_url']))
            target_cat_id = c.lastrowid
            print(f"  [{slug}] Kategori oluşturuldu")

        # Mevcut tüm ürünleri sil
        c.execute("DELETE FROM products WHERE category_id = ?", (target_cat_id,))

        # Merkez ürünlerini sıfırdan ekle
        for mp in merkez_products:
            c.execute("""
                INSERT INTO products (category_id, name, description, price, image_url, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (target_cat_id, mp['name'], mp['description'], mp['price'], mp['image_url'], mp['sort_order']))

        print(f"  [{slug}] '{cat_name}': {len(merkez_products)} ürün yazıldı")

conn.commit()
conn.close()
print("\nTamamlandı.")
