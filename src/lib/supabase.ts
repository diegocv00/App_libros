import { createClient } from '@supabase/supabase-js';
// Se importa desde '@env', no desde el archivo físico
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);