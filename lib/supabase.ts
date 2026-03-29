import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SUPABASE_TABLES = {
  ACTIVITIES: 'activities',
} as const;
