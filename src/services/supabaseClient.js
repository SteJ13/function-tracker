import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dyfripwdacygcyddkyza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tVqRzJX6yLLxavXudRUXQg_KELXugsG';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
