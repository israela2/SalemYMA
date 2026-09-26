import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcgqhrchixzgvchhrdyz.supabase.co';
const supabasePublishableKey = 'sb_publishable_EQB0fGlDZAh5PZ3-1qStNg_NIyBVtWk';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);