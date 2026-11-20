CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  subtotal_rupees INTEGER NOT NULL,
  total_rupees INTEGER NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_phone_status_idx ON orders (phone_e164, status);
