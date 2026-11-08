import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-role-key-placeholder';
const anonKey = process.env.SUPABASE_ANON_KEY || 'demo-anon-key-placeholder';

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
