import { createClient } from '@supabase/supabase-js';

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://dyfripwdacygcyddkyza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tVqRzJX6yLLxavXudRUXQg_KELXugsG';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
