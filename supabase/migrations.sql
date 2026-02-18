-- ─── TABLA: drafts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_name  text NOT NULL DEFAULT 'Sin nombre',
  title       text,
  author      text,
  description text,
  condition   text,
  price       text,
  photos      text[] DEFAULT '{}',
  cover_index int  DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

-- Si la tabla ya existía sin draft_name, agrégala:
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS draft_name text NOT NULL DEFAULT 'Sin nombre';

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own drafts" ON drafts;
CREATE POLICY "Users can manage their own drafts"
  ON drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── TABLA: favorites ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
CREATE POLICY "Users can manage their own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── TABLA: ratings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id   uuid REFERENCES listings(id) ON DELETE SET NULL,
  stars        int  NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (reviewer_id, seller_id, listing_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ratings" ON ratings;
CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviewers can manage their ratings" ON ratings;
CREATE POLICY "Reviewers can manage their ratings"
  ON ratings FOR ALL
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);


-- ─── POLÍTICA EXTRA: listings update ─────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can update their listings" ON listings;
CREATE POLICY "Sellers can update their listings"
  ON listings FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
