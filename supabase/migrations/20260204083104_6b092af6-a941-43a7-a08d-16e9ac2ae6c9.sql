-- Fix search_path for calculate_karma_tier function
CREATE OR REPLACE FUNCTION public.calculate_karma_tier(_karma NUMERIC)
RETURNS public.karma_tier
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _karma >= 5000 THEN 'core'::public.karma_tier
    WHEN _karma >= 2000 THEN 'maintainer'::public.karma_tier
    WHEN _karma >= 500 THEN 'trusted'::public.karma_tier
    WHEN _karma >= 100 THEN 'contributor'::public.karma_tier
    ELSE 'observer'::public.karma_tier
  END
$$;