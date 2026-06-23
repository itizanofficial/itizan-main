import { createClient } from '@supabase/supabase-js';

// هتاخد المتغيرات دي من ملف .env بتاعك 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);