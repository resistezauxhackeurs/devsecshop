-- devsecshop/seed/schema.sql
-- Schéma de la boutique DevSecShop.

CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  -- ⚠️ Mots de passe stockés en MD5 (faible) pour le TP crack/brute force.
  password TEXT NOT NULL,
  email    TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  image_url   TEXT,
  stock       INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  -- JSON des lignes de commande (produit, quantité, prix unitaire).
  items_json TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
