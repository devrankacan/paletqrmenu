import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'menu.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 10000');
  return _db;
}

let _initialized = false;

export function initDb() {
  if (_initialized) return;
  _initialized = true;
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      working_hours TEXT DEFAULT '',
      wifi_password TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add logo_url to branches if missing
  const branchCols = (db.prepare('PRAGMA table_info(branches)').all() as Array<{ name: string }>).map((c) => c.name);
  if (!branchCols.includes('logo_url')) {
    db.exec(`ALTER TABLE branches ADD COLUMN logo_url TEXT DEFAULT ''`);
  }

  // Migration: recreate categories without UNIQUE slug if no products exist
  const catCols = (db.prepare('PRAGMA table_info(categories)').all() as Array<{ name: string }>).map((c) => c.name);
  const hasBranchId = catCols.includes('branch_id');

  if (!hasBranchId) {
    const productCount = catCols.length === 0
      ? 0
      : (db.prepare('SELECT COUNT(*) as n FROM products').get() as { n: number }).n;

    if (productCount === 0 && catCols.length > 0) {
      db.exec('DROP TABLE IF EXISTS categories;');
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT DEFAULT '🍽️',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (productCount > 0) {
      db.exec('ALTER TABLE categories ADD COLUMN branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE');
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed settings
  const stCount = (db.prepare('SELECT COUNT(*) as n FROM settings').get() as { n: number }).n;
  if (stCount === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    ins.run('restaurant_name', 'Palet');
    ins.run('restaurant_subtitle', 'Lezzet Sanatı');
    ins.run('currency', '₺');
  }
}

// ── Branches ──────────────────────────────────────────────────────────────────

export function getBranches() {
  return getDb().prepare('SELECT * FROM branches ORDER BY sort_order ASC, id ASC').all();
}

export function getBranchBySlug(slug: string) {
  return getDb().prepare('SELECT * FROM branches WHERE slug = ?').get(slug);
}

export function getBranchById(id: number) {
  return getDb().prepare('SELECT * FROM branches WHERE id = ?').get(id);
}

export function createBranch(data: {
  name: string; slug: string; address?: string;
  phone?: string; working_hours?: string; wifi_password?: string;
}) {
  const result = getDb().prepare(`
    INSERT INTO branches (name, slug, address, phone, working_hours, wifi_password)
    VALUES (@name, @slug, @address, @phone, @working_hours, @wifi_password)
  `).run({ address: '', phone: '', working_hours: '', wifi_password: '', ...data });
  return result.lastInsertRowid;
}

export function updateBranch(id: number, data: Partial<{
  name: string; slug: string; address: string; phone: string;
  working_hours: string; wifi_password: string; is_active: number;
}>) {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  getDb().prepare(`UPDATE branches SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function deleteBranch(id: number) {
  getDb().prepare('DELETE FROM branches WHERE id = ?').run(id);
}

// ── Categories ────────────────────────────────────────────────────────────────

export function getCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
}

export function getCategoriesByBranch(branchId: number) {
  return getDb().prepare(
    'SELECT * FROM categories WHERE branch_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(branchId);
}

export function getCategoryBySlug(slug: string) {
  return getDb().prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}

export function createCategory(data: {
  branch_id: number; name: string; slug: string; icon?: string; sort_order?: number;
}) {
  const result = getDb().prepare(`
    INSERT INTO categories (branch_id, name, slug, icon, sort_order)
    VALUES (@branch_id, @name, @slug, @icon, @sort_order)
  `).run({ icon: '🍽️', sort_order: 0, ...data });
  return result.lastInsertRowid;
}

export function updateCategory(id: number, data: Partial<{ name: string; icon: string; sort_order: number }>) {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  getDb().prepare(`UPDATE categories SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function deleteCategory(id: number) {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
}

// ── Products ──────────────────────────────────────────────────────────────────

export function getProductsByCategory(categoryId: number) {
  return getDb().prepare(
    'SELECT * FROM products WHERE category_id = ? AND is_available = 1 ORDER BY sort_order ASC, id ASC'
  ).all(categoryId);
}

export function getAllProductsWithCategory() {
  return getDb().prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order ASC, p.sort_order ASC
  `).all();
}

export function getAllProductsWithCategoryByBranch(branchId: number) {
  return getDb().prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p JOIN categories c ON p.category_id = c.id
    WHERE c.branch_id = ?
    ORDER BY c.sort_order ASC, p.sort_order ASC, p.id ASC
  `).all(branchId);
}

export function createProduct(data: {
  category_id: number; name: string; description?: string;
  price: number; image_url?: string; is_featured?: number;
}) {
  const result = getDb().prepare(`
    INSERT INTO products (category_id, name, description, price, image_url, is_featured)
    VALUES (@category_id, @name, @description, @price, @image_url, @is_featured)
  `).run(data);
  return result.lastInsertRowid;
}

export function updateProduct(id: number, data: {
  name?: string; description?: string; price?: number;
  image_url?: string; is_available?: number; is_featured?: number; category_id?: number;
}) {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  getDb().prepare(`UPDATE products SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function deleteProduct(id: number) {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
}

export function getProductById(id: number) {
  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function updateSetting(key: string, value: string) {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function getAdminUser(username: string) {
  return getDb().prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as
    | { id: number; username: string; password_hash: string } | undefined;
}

export function createAdminUser(username: string, passwordHash: string) {
  getDb().prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
}

export function adminUserExists() {
  return ((getDb().prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count) > 0;
}
