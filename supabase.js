import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://ssuqjjiptqdgiwawdshl.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "sb_publishable_0sHINGTYGwYtzY34ri9zqQ__6Lnr4Qv";

export const configured =
  !SUPABASE_URL.startsWith("COLE") && !SUPABASE_ANON_KEY.startsWith("COLE");

export const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
