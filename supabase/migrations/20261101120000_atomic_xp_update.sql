-- Atomic XP accumulation for the ZMB Discord bot.
--
-- Previously src/utils/xpManager.js read the row, added the amount in JavaScript
-- and wrote the absolute total back. Two messages processed at the same time
-- could read the same starting value and one increment was lost.
--
-- public.add_xp() does the addition inside a single INSERT ... ON CONFLICT DO
-- UPDATE statement, so PostgreSQL serialises concurrent updates on the
-- (guild_id, user_id) unique index and no increment can be lost. The level is
-- derived from the value the statement itself returned, never from a value read
-- before the write.

CREATE OR REPLACE FUNCTION public.add_xp(
  p_guild_id text,
  p_user_id text,
  p_amount integer
)
RETURNS TABLE (xp integer, level integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_xp integer;
  v_level integer := 0;
  v_needed integer := 100;
  v_remaining integer;
BEGIN
  IF p_amount IS NULL THEN
    p_amount := 0;
  END IF;

  INSERT INTO public.xp_data AS x (guild_id, user_id, xp, level, last_xp_at)
  VALUES (p_guild_id, p_user_id, GREATEST(p_amount, 0), 0, now())
  ON CONFLICT (guild_id, user_id)
  DO UPDATE SET
    xp = GREATEST(x.xp + EXCLUDED.xp, 0),
    last_xp_at = now()
  RETURNING x.xp INTO v_xp;

  -- Recompute the level from the authoritative total returned above.
  -- xpForLevel(level) = 5 * level^2 + 50 * level + 100
  v_remaining := v_xp;
  WHILE v_remaining >= v_needed LOOP
    v_remaining := v_remaining - v_needed;
    v_level := v_level + 1;
    v_needed := 5 * v_level * v_level + 50 * v_level + 100;
  END LOOP;

  UPDATE public.xp_data
  SET level = v_level
  WHERE guild_id = p_guild_id AND user_id = p_user_id;

  xp := v_xp;
  level := v_level;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.add_xp(text, text, integer) IS
  'Atomic XP increment used by the ZMB bot. Returns the new total and level.';

GRANT EXECUTE ON FUNCTION public.add_xp(text, text, integer) TO anon, authenticated;
