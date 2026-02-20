import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://qbgxmvzphblvyvgtmisa.supabase.co';
const supabaseAnonKey = 'sb_publishable_wKi3Hc-llkCxxJ4gsIjkWQ_q26RNHDW';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan las variables de entorno de Supabase.");

}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);