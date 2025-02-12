-- Vytvoření tabulky pro výčepy
CREATE TABLE taps (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Vytvoření tabulky pro záznamy čištění
CREATE TABLE cleaning_records (
  id SERIAL PRIMARY KEY,
  tap_id INTEGER REFERENCES taps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  employee TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Vytvoření indexů pro rychlejší vyhledávání
CREATE INDEX cleaning_records_tap_id_date_idx ON cleaning_records(tap_id, date);

-- Vložení výchozích výčepů
INSERT INTO taps (name) VALUES
  ('Výčep 1'),
  ('Výčep 2'),
  ('Výčep 3'),
  ('Výčep 4'),
  ('Výčep 5');

-- Nastavení Row Level Security (RLS)
ALTER TABLE taps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_records ENABLE ROW LEVEL SECURITY;

-- Vytvoření policy pro přístup k datům
CREATE POLICY "Public access to taps" ON taps
  FOR ALL USING (true);

CREATE POLICY "Public access to cleaning records" ON cleaning_records
  FOR ALL USING (true); 