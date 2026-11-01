const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client for the bot.
 *
 * The bot runs server-side, but it still talks to Supabase with the project's
 * public API key: every query in src/utils/*.js is a plain table read/write and
 * the migrations grant those operations to the `anon` role. Row Level Security
 * is enabled on every table with permissive `USING (true)` policies, so access
 * control currently comes from the key itself being trusted, not from policies.
 *
 * A service-role key is supported but not required. If it is provided it is used
 * server-side only and must never be logged, committed or exposed to any client.
 */
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '[DB] Missing Supabase configuration. Set SUPABASE_URL (or VITE_SUPABASE_URL) and ' +
      'SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in the environment.'
  );
}

const supabase = createClient(url, key, {
  auth: {
    // Server-side client: never persist or refresh user sessions.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

module.exports = supabase;
