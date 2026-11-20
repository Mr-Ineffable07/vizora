CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  subtotal_rupees INTEGER NOT NULL,
  discount_rupees INTEGER NOT NULL DEFAULT 0,
  total_rupees INTEGER NOT NULL,
  coupon_code TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_phone_status_idx ON orders (phone_e164, status);

CREATE TABLE IF NOT EXISTS coupon_claims (
  phone_e164 TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'completed', 'released')),
  created_at INTEGER NOT NULL
);