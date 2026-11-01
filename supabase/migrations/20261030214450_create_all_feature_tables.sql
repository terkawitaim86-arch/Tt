/*
# Create tables for guild settings, XP, rewards, reaction roles, embeds, custom commands, reminders, AFK, and jail records

1. New Tables
- `guild_settings` — per-server configuration (welcome, goodbye, auto role, log channels, jail, XP, anti-spam)
- `xp_data` — per-user XP and level tracking per guild
- `level_rewards` — auto-assigned roles at level milestones
- `reaction_roles` — reaction-to-role mappings
- `button_roles` — button-to-role mappings
- `custom_commands` — user-created custom commands per server
- `embed_templates` — saved embed templates
- `reminders` — user reminders with due time
- `afk_status` — per-user AFK status per guild
- `jail_records` — jailed users and previous roles for restoration

2. Security
- RLS enabled on all tables, CRUD granted to anon + authenticated.
*/

CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id text PRIMARY KEY,
  welcome_channel_id text,
  welcome_message text,
  goodbye_channel_id text,
  goodbye_message text,
  auto_role_id text,
  log_chat_channel_id text,
  log_server_channel_id text,
  log_role_channel_id text,
  log_mod_channel_id text,
  jail_role_id text,
  jail_channel_id text,
  xp_enabled boolean DEFAULT true,
  xp_cooldown_seconds integer DEFAULT 60,
  xp_min integer DEFAULT 15,
  xp_max integer DEFAULT 25,
  xp_ignored_channels text[] DEFAULT '{}',
  xp_boost_channels text[] DEFAULT '{}',
  anti_spam_enabled boolean DEFAULT false,
  anti_spam_threshold integer DEFAULT 5,
  anti_spam_interval_seconds integer DEFAULT 3,
  anti_spam_action text DEFAULT 'timeout',
  anti_spam_duration_seconds integer DEFAULT 600,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guild_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guild_settings TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_gs" ON guild_settings;
CREATE POLICY "anon_read_gs" ON guild_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_gs" ON guild_settings;
CREATE POLICY "anon_insert_gs" ON guild_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_gs" ON guild_settings;
CREATE POLICY "anon_update_gs" ON guild_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_gs" ON guild_settings;
CREATE POLICY "anon_delete_gs" ON guild_settings FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS xp_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  xp integer DEFAULT 0,
  level integer DEFAULT 0,
  last_xp_at timestamptz,
  UNIQUE(guild_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_xp_guild_user ON xp_data(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_xp_guild_xp ON xp_data(guild_id, xp DESC);

ALTER TABLE xp_data ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON xp_data TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_xp" ON xp_data;
CREATE POLICY "anon_read_xp" ON xp_data FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_xp" ON xp_data;
CREATE POLICY "anon_insert_xp" ON xp_data FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_xp" ON xp_data;
CREATE POLICY "anon_update_xp" ON xp_data FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_xp" ON xp_data;
CREATE POLICY "anon_delete_xp" ON xp_data FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS level_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  level integer NOT NULL,
  role_id text NOT NULL,
  UNIQUE(guild_id, level)
);
CREATE INDEX IF NOT EXISTS idx_rewards_guild ON level_rewards(guild_id, level);

ALTER TABLE level_rewards ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON level_rewards TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_rewards" ON level_rewards;
CREATE POLICY "anon_read_rewards" ON level_rewards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rewards" ON level_rewards;
CREATE POLICY "anon_insert_rewards" ON level_rewards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rewards" ON level_rewards;
CREATE POLICY "anon_update_rewards" ON level_rewards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rewards" ON level_rewards;
CREATE POLICY "anon_delete_rewards" ON level_rewards FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS reaction_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  emoji text NOT NULL,
  role_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reaction_roles_message ON reaction_roles(message_id);

ALTER TABLE reaction_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON reaction_roles TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_rr" ON reaction_roles;
CREATE POLICY "anon_read_rr" ON reaction_roles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rr" ON reaction_roles;
CREATE POLICY "anon_insert_rr" ON reaction_roles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rr" ON reaction_roles;
CREATE POLICY "anon_update_rr" ON reaction_roles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rr" ON reaction_roles;
CREATE POLICY "anon_delete_rr" ON reaction_roles FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS button_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  label text NOT NULL,
  style integer NOT NULL DEFAULT 2,
  role_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_button_roles_message ON button_roles(message_id);

ALTER TABLE button_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON button_roles TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_br" ON button_roles;
CREATE POLICY "anon_read_br" ON button_roles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_br" ON button_roles;
CREATE POLICY "anon_insert_br" ON button_roles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_br" ON button_roles;
CREATE POLICY "anon_update_br" ON button_roles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_br" ON button_roles;
CREATE POLICY "anon_delete_br" ON button_roles FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS custom_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  command_name text NOT NULL,
  response text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, command_name)
);
CREATE INDEX IF NOT EXISTS idx_custom_commands_guild ON custom_commands(guild_id);

ALTER TABLE custom_commands ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_commands TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_cc" ON custom_commands;
CREATE POLICY "anon_read_cc" ON custom_commands FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cc" ON custom_commands;
CREATE POLICY "anon_insert_cc" ON custom_commands FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cc" ON custom_commands;
CREATE POLICY "anon_update_cc" ON custom_commands FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cc" ON custom_commands;
CREATE POLICY "anon_delete_cc" ON custom_commands FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS embed_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, name)
);

ALTER TABLE embed_templates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON embed_templates TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_et" ON embed_templates;
CREATE POLICY "anon_read_et" ON embed_templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_et" ON embed_templates;
CREATE POLICY "anon_insert_et" ON embed_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_et" ON embed_templates;
CREATE POLICY "anon_update_et" ON embed_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_et" ON embed_templates;
CREATE POLICY "anon_delete_et" ON embed_templates FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  user_id text NOT NULL,
  message text NOT NULL,
  due_at timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at) WHERE completed = false;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_rem" ON reminders;
CREATE POLICY "anon_read_rem" ON reminders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rem" ON reminders;
CREATE POLICY "anon_insert_rem" ON reminders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rem" ON reminders;
CREATE POLICY "anon_update_rem" ON reminders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rem" ON reminders;
CREATE POLICY "anon_delete_rem" ON reminders FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS afk_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  reason text NOT NULL DEFAULT 'AFK',
  created_at timestamptz DEFAULT now(),
  UNIQUE(guild_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_afk_guild_user ON afk_status(guild_id, user_id);

ALTER TABLE afk_status ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON afk_status TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_afk" ON afk_status;
CREATE POLICY "anon_read_afk" ON afk_status FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_afk" ON afk_status;
CREATE POLICY "anon_insert_afk" ON afk_status FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_afk" ON afk_status;
CREATE POLICY "anon_update_afk" ON afk_status FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_afk" ON afk_status;
CREATE POLICY "anon_delete_afk" ON afk_status FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS jail_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  previous_roles text[] NOT NULL DEFAULT '{}',
  jailed_by text NOT NULL,
  reason text,
  jailed_at timestamptz DEFAULT now(),
  released_at timestamptz,
  active boolean DEFAULT true,
  UNIQUE(guild_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_jail_guild_user ON jail_records(guild_id, user_id);

ALTER TABLE jail_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON jail_records TO anon, authenticated;
DROP POLICY IF EXISTS "anon_read_jail" ON jail_records;
CREATE POLICY "anon_read_jail" ON jail_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_jail" ON jail_records;
CREATE POLICY "anon_insert_jail" ON jail_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_jail" ON jail_records;
CREATE POLICY "anon_update_jail" ON jail_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_jail" ON jail_records;
CREATE POLICY "anon_delete_jail" ON jail_records FOR DELETE TO anon, authenticated USING (true);
