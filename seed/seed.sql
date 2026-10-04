-- devsecshop/seed/seed.sql
-- Jeu de données initial.
-- Les mots de passe sont des hash MD5 (volontairement faibles) :
--   admin   -> MD5("S3cur3P@ss")        = voir énoncé TP3
--   alice   -> MD5("password")          = 5f4dcc3b5aa765d61d8327deb882cf99
--   bob     -> MD5("sunshine")          = 0571749e2ac330a7455809c6b0e7af90
-- Le compte alice a un mot de passe dans le top-100 des listes -> brute force facile.

INSERT INTO users (username, password, email, is_admin) VALUES
  ('admin', 'c2fe1ddfce87639e0d1eb1d1157070fe', 'admin@devsecshop.test', 1),
  ('alice', '5f4dcc3b5aa765d61d8327deb882cf99', 'alice@example.test', 0),
  ('bob',   '0571749e2ac330a7455809c6b0e7af90', 'bob@example.test',   0);

INSERT INTO products (name, description, price_cents, image_url, stock) VALUES
  ('Clavier mécanique', 'Switches bruyants, collègues ravis.', 8900, '/img/keyboard.png', 42),
  ('Casque anti-bruit', 'Pour ignorer lesdits collègues.', 14900, '/img/headset.png', 30),
  ('Webcam 4K', 'Visible même quand vous ne voulez pas.', 6900, '/img/webcam.png', 55),
  ('Hub USB-C', 'Sept ports, six de trop.', 3900, '/img/hub.png', 120);

-- Commande appartenant à alice (user_id = 2) : sert au TP IDOR (niveau 3).
INSERT INTO orders (user_id, items_json, total_cents) VALUES
  (2, '[{"product_id":1,"qty":1,"unit_cents":8900}]', 8900);
