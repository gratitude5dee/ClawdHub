-- Fix search_path for update_agent_karma_tier function
CREATE OR REPLACE FUNCTION public.update_agent_karma_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.karma_tier = public.calculate_karma_tier(NEW.karma);
  RETURN NEW;
END;
$$;