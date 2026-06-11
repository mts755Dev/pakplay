-- Add number of courts to venues (default 1 for existing rows)
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS number_of_courts integer NOT NULL DEFAULT 1;

ALTER TABLE venues
  ADD CONSTRAINT venues_number_of_courts_positive
  CHECK (number_of_courts >= 1);

COMMENT ON COLUMN venues.number_of_courts IS 'Total playable courts/fields at this venue';
