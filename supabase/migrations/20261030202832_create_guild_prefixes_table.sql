/*
# Create guild_prefixes table for per-server Discord bot prefixes

1. New Tables
- `guild_prefixes`
  - `guild_id` (text, primary key) — Discord guild/server ID
  - `prefix` (text, not null) — custom command prefix for this guild
  - `created_at` (timestamptz) — when the prefix was first set
  - `updated_at` (timestamptz) — when the prefix was last changed
2. Security
- Enable RLS on `guild_prefixes`.
- Grant CRUD to `anon` + `authenticated` — the Discord bot uses the anon key to read/write prefix settings.
- Allow anon + authenticated full CRUD because the bot is the only client and the data is intentionally shared across the single bot instance.
3. Notes
- A trigger automatically updates `updated_at` whenever a row is modified.
- If no row exists for a guild, the bot falls back to the default prefix (",").
*/

CREATE TABLE IF NOT EXISTS guild_prefixes (
  guild_id text PRIMARY KEY,
  prefix text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guild_prefixes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON guild_prefixes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_read_prefixes" ON guild_prefixes;
CREATE POLICY "anon_read_prefixes" ON guild_prefixes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_prefixes" ON guild_prefixes;
CREATE POLICY "anon_insert_prefixes" ON guild_prefixes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_prefixes" ON guild_prefixes;
CREATE POLICY "anon_update_prefixes" ON guild_prefixes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_prefixes" ON guild_prefixes;
CREATE POLICY "anon_delete_prefixes" ON guild_prefixes FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guild_prefixes_updated_at ON guild_prefixes;
CREATE TRIGGER guild_prefixes_updated_at
  BEFORE UPDATE ON guild_prefixes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
