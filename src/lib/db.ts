import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'menu.db');

// Singleton connection per process — avoids lock contention during build/dev
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

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
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
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

  // Seed categories
  const catCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;
  if (catCount === 0) {
    const insert = db.prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)');
    const categories = [
      ['Kahvaltılıklar', 'kahvaltilikar', '🍳', 1],
      ['Çorbalar', 'corbalar', '🍲', 2],
      ['Çocuk Menüsü', 'cocuk-menusu', '🍟', 3],
      ['Pizzalar', 'pizzalar', '🍕', 4],
      ['Beyaz Etler / Kırmızı Etler', 'etler', '🥩', 5],
      ['Tatlılar', 'tatlilar', '🍮', 6],
      ['Soğuk / Sıcak İçecekler', 'icecekler', '🥤', 7],
    ];
    for (const cat of categories) {
      insert.run(...cat);
    }
  }

  // Seed default settings
  const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('restaurant_name', 'Palet');
    insertSetting.run('restaurant_subtitle', 'Lezzet Sanatı');
    insertSetting.run('currency', '₺');
    insertSetting.run('logo_url', '');
    insertSetting.run('accent_color', '#C9A96E');
  }
}

export function getCategories() {
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
}

export function getCategoryBySlug(slug: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}

export function getProductsByCategory(categoryId: number) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM products WHERE category_id = ? AND is_available = 1 ORDER BY sort_order ASC, id ASC'
  ).all(categoryId);
}

export function getAllProductsWithCategory() {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order ASC, p.sort_order ASC
  `).all();
}

export function getSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getAdminUser(username: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as
    | { id: number; username: string; password_hash: string }
    | undefined;
}

export function createAdminUser(username: string, passwordHash: string) {
  const db = getDb();
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
}

export function adminUserExists() {
  const db = getDb();
  return ((db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count) > 0;
}

// Product CRUD
export function createProduct(data: {
  category_id: number; name: string; description?: string;
  price: number; image_url?: string; is_featured?: number;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, price, image_url, is_featured)
    VALUES (@category_id, @name, @description, @price, @image_url, @is_featured)
  `).run(data);
  return result.lastInsertRowid;
}

export function updateProduct(id: number, data: {
  name?: string; description?: string; price?: number;
  image_url?: string; is_available?: number; is_featured?: number; category_id?: number;
}) {
  const db = getDb();
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE products SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function deleteProduct(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

export function getProductById(id: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

export function updateSetting(key: string, value: string) {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}
