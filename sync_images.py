#!/usr/bin/env python3
"""
Merkez şubesindeki TÜM kategorileri ve ürünleri (görsel, açıklama, fiyat)
diğer tüm şubelere birebir kopyalar/günceller.
Her şube kendi bağımsız satırlarına sahip olur.
"""
import sqlite3

DB_PATH = '/var/www/paletpastanesi/data/menu.db'

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Merkez şubesini bul
c.execute("SELECT id, slug FROM branches WHERE slug LIKE '%merkez%'")
merkez = c.fetchone()
if not merkez:
    c.execute("SELECT id, slug FROM branches")
    rows = c.fetchall()
    print("Şubeler:", [dict(r) for r in rows])
    raise SystemExit("Merkez şubesi bulunamadı")

merkez_id = merkez['id']
print(f"Merkez: id={merkez_id}, slug={merkez['slug']}")

c.execute("SELECT id, slug FROM branches WHERE id != ?", (merkez_id,))
other_branches = c.fetchall()
print(f"Diğer şubeler: {[b['slug'] for b in other_branches]}\n")

# Merkez'deki tüm kategorileri al
c.execute("SELECT id, name, cover_url, icon, sort_order FROM categories WHERE branch_id = ? ORDER BY sort_order", (merkez_id,))
all_merkez_cats = c.fetchall()
print(f"Merkez'de {len(all_merkez_cats)} kategori bulundu.\n")

for merkez_cat in all_merkez_cats:
    cat_name = merkez_cat['name']

    # Merkez'deki ürünleri al
    c.execute("SELECT * FROM products WHERE category_id = ? ORDER BY sort_order", (merkez_cat['id'],))
    merkez_products = c.fetchall()
    print(f"'{cat_name}' — Merkez'de {len(merkez_products)} ürün")

    for branch in other_branches:
        branch_id = branch['id']
        slug = branch['slug']

        # Hedef kategorisi var mı?
        c.execute("SELECT id FROM categories WHERE branch_id = ? AND name = ?", (branch_id, cat_name))
        target_cat = c.fetchone()

        if not target_cat:
            # Kategori yok, oluştur
            c.execute("""
                INSERT INTO categories (branch_id, name, icon, sort_order, cover_url)
                VALUES (?, ?, ?, ?, ?)
            """, (branch_id, merkez_cat['name'], merkez_cat['icon'], merkez_cat['sort_order'], merkez_cat['cover_url']))
            target_cat_id = c.lastrowid
            print(f"  [{slug}] Kategori oluşturuldu: '{cat_name}'")
        else:
            target_cat_id = target_cat['id']
            # Kategori kapak görselini ve ikonunu güncelle
            c.execute("""
                UPDATE categories SET cover_url = ?, icon = ? WHERE id = ?
            """, (merkez_cat['cover_url'], merkez_cat['icon'], target_cat_id))

        # Hedef şubedeki mevcut ürünleri al
        c.execute("SELECT * FROM products WHERE category_id = ?", (target_cat_id,))
        existing = {p['name']: p for p in c.fetchall()}

        added = 0
        updated = 0
        deleted = 0

        merkez_names = {mp['name'] for mp in merkez_products}

        # Merkez'de olmayan ürünleri sil
        for name, ep in existing.items():
            if name not in merkez_names:
                c.execute("DELETE FROM products WHERE id = ?", (ep['id'],))
                deleted += 1

        for mp in merkez_products:
            name = mp['name']
            if name in existing:
                ep = existing[name]
                c.execute("""
                    UPDATE products
                    SET image_url = ?, description = ?, price = ?, sort_order = ?
                    WHERE id = ?
                """, (mp['image_url'], mp['description'], mp['price'], mp['sort_order'], ep['id']))
                updated += 1
            else:
                c.execute("""
                    INSERT INTO products (category_id, name, description, price, image_url, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (target_cat_id, mp['name'], mp['description'], mp['price'], mp['image_url'], mp['sort_order']))
                added += 1

        print(f"  [{slug}] '{cat_name}': {updated} güncellendi, {added} eklendi, {deleted} silindi")

conn.commit()
conn.close()
print("\nTamamlandı.")
