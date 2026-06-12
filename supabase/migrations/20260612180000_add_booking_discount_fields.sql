-- Track special offer / loyalty discounts applied at booking time
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS discount_type text
    CHECK (discount_type IS NULL OR discount_type IN ('offer', 'loyalty')),
  ADD COLUMN IF NOT EXISTS discount_label text;
