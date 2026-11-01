/*
# Create moderation tables for warnings and mod logs

1. New Tables
- `moderation_warnings`
  - `id` (uuid, primary key) — unique warning ID
  - `guild_id` (text, not null) — Discord guild/server ID
  - `user_id` (text, not null) — Discord user who was warned
  - `moderator_id` (text, not null) — Discord user who issued the warning
  - `reason` (text) — reason for the warning
  - `created_at` (timestamptz) — when the warning was issued
- `moderation_logs`
  - `id` (uuid, primary key) — unique log entry ID
  - `guild_id` (text, not null) — Discord guild/server ID
  - `action` (text, not null) — type of action (ban, kick, timeout, untimeout, warn, clear)
  - `target_id` (text, not null) — Discord user who was the target of the action
  - `moderator_id` (text, not null) — Discord user who performed the action
  - `reason` (text) — reason for the action
  - `duration` (text) — duration for timeout actions, null otherwise
  - `created_at` (timestamptz) — when the action was logged
2. Indexes
- `idx_warnings_guild_user` on moderation_warnings(guild_id, user_id) for fast lookup of a user's warnings in a guild
- `idx_logs_guild` on moderation_logs(guild_id, created_at DESC) for fetching recent logs per guild
3. Security
- Enable RLS on both tables.
- Grant CRUD to anon + authenticated — the Discord bot uses the anon key to read/write moderation data.
- Allow anon + authenticated full CRUD because the bot is the only client and the data is shared across the single bot instance.
*/

CREATE TABLE IF NOT EXISTS moderation_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  moderator_id text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON moderation_warnings(guild_id, user_id);

ALTER TABLE moderation_warnings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_warnings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_read_warnings" ON moderation_warnings;
CREATE POLICY "anon_read_warnings" ON moderation_warnings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_warnings" ON moderation_warnings;
CREATE POLICY "anon_insert_warnings" ON moderation_warnings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_warnings" ON moderation_warnings;
CREATE POLICY "anon_update_warnings" ON moderation_warnings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_warnings" ON moderation_warnings;
CREATE POLICY "anon_delete_warnings" ON moderation_warnings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  action text NOT NULL,
  target_id text NOT NULL,
  moderator_id text NOT NULL,
  reason text,
  duration text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_guild ON moderation_logs(guild_id, created_at DESC);

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_logs TO anon, authenticated;

DROP POLICY IF EXISTS "anon_read_logs" ON moderation_logs;
CREATE POLICY "anon_read_logs" ON moderation_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_logs" ON moderation_logs;
CREATE POLICY "anon_insert_logs" ON moderation_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_logs" ON moderation_logs;
CREATE POLICY "anon_update_logs" ON moderation_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_logs" ON moderation_logs;
CREATE POLICY "anon_delete_logs" ON moderation_logs FOR DELETE
  TO anon, authenticated USING (true);
