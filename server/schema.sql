CREATE TABLE IF NOT EXISTS artists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  biography TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genres (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS albums (
  id BIGSERIAL PRIMARY KEY,
  catalog_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist_id BIGINT NOT NULL REFERENCES artists(id),
  genre_id BIGINT REFERENCES genres(id),
  release_year INT NOT NULL CHECK (release_year BETWEEN 1800 AND 2200),
  description TEXT NOT NULL DEFAULT '',
  artwork_palette INT NOT NULL DEFAULT 0,
  artwork_url TEXT,
  itunes_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
  id BIGSERIAL PRIMARY KEY,
  album_id BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  track_number INT NOT NULL CHECK (track_number > 0),
  title TEXT NOT NULL,
  duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
  UNIQUE (album_id, track_number)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  album_id BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('Vinyl', 'CD', 'Cassette', 'Digital')),
  edition_name TEXT NOT NULL DEFAULT 'Standard',
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_preorder BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (album_id, format, edition_name)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id BIGINT NOT NULL REFERENCES product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id BIGINT REFERENCES users(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents INT NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  total_cents INT NOT NULL CHECK (total_cents >= 0),
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id BIGINT REFERENCES product_variants(id),
  album_title TEXT NOT NULL,
  format TEXT NOT NULL,
  unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
  quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, album_id)
);

CREATE INDEX IF NOT EXISTS albums_artist_idx ON albums(artist_id);
CREATE INDEX IF NOT EXISTS variants_album_idx ON product_variants(album_id);
CREATE INDEX IF NOT EXISTS tracks_album_idx ON tracks(album_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email);
