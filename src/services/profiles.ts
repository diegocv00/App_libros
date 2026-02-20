import { supabase } from '../lib/supabase';

export async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
}

export async function updateProfileName(newName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);

    if (error) throw error;
}