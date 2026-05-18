#!/usr/bin/env python3
"""
Sync image_url from Merkez branch to all other branches
for the specified categories, matching by product name.
Also syncs category cover_url.
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

# Get Merkez branch
c.execute("SELECT id, slug FROM branches WHERE slug LIKE '%merkez%'")
merkez = c.fetchone()
if not merkez:
    c.execute("SELECT id, slug FROM branches")
    rows = c.fetchall()
    print("Branches:", [dict(r) for r in rows])
    raise SystemExit("Merkez branch not found")

merkez_id = merkez['id']
print(f"Merkez branch: id={merkez_id}, slug={merkez['slug']}")

# Get all other branches
c.execute("SELECT id, slug FROM branches WHERE id != ?", (merkez_id,))
other_branches = c.fetchall()
print(f"Other branches: {[b['slug'] for b in other_branches]}")

# For each target category, get Merkez category + products
for cat_name in TARGET_CATEGORIES:
    c.execute("""
        SELECT id, name, cover_url FROM categories
        WHERE branch_id = ? AND name = ?
    """, (merkez_id, cat_name))
    merkez_cat = c.fetchone()
    if not merkez_cat:
        print(f"  [SKIP] '{cat_name}' not found in Merkez")
        continue

    # Get all products in this Merkez category
    c.execute("""
        SELECT id, name, image_url FROM products
        WHERE category_id = ?
    """, (merkez_cat['id'],))
    merkez_products = {row['name']: row for row in c.fetchall()}

    print(f"\nCategory '{cat_name}' — {len(merkez_products)} products in Merkez")

    for branch in other_branches:
        branch_id = branch['id']
        branch_slug = branch['slug']

        # Find matching category in this branch
        c.execute("""
            SELECT id, name, cover_url FROM categories
            WHERE branch_id = ? AND name = ?
        """, (branch_id, cat_name))
        target_cat = c.fetchone()
        if not target_cat:
            print(f"  [{branch_slug}] category not found, skipping")
            continue

        # Sync category cover_url if different
        if merkez_cat['cover_url'] and merkez_cat['cover_url'] != target_cat['cover_url']:
            c.execute("""
                UPDATE categories SET cover_url = ? WHERE id = ?
            """, (merkez_cat['cover_url'], target_cat['id']))
            print(f"  [{branch_slug}] Updated cover_url for '{cat_name}'")

        # Get products in target category
        c.execute("""
            SELECT id, name, image_url FROM products
            WHERE category_id = ?
        """, (target_cat['id'],))
        target_products = c.fetchall()

        updated = 0
        for prod in target_products:
            merkez_prod = merkez_products.get(prod['name'])
            if merkez_prod and merkez_prod['image_url'] and merkez_prod['image_url'] != prod['image_url']:
                c.execute("""
                    UPDATE products SET image_url = ? WHERE id = ?
                """, (merkez_prod['image_url'], prod['id']))
                updated += 1
                print(f"    [{branch_slug}] '{prod['name']}': {prod['image_url']} -> {merkez_prod['image_url']}")

        if updated == 0:
            print(f"  [{branch_slug}] '{cat_name}': all images already match")
        else:
            print(f"  [{branch_slug}] '{cat_name}': updated {updated} product images")

conn.commit()
conn.close()
print("\nDone.")
