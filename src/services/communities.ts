import { supabase } from '../lib/supabase';
import { Community, CommunityInput } from '../types';

export async function createCommunity(input: CommunityInput): Promise<Community> {
  const { data, error } = await supabase
    .from('communities')
    .insert([input])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Community;
}

export async function fetchCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Community[];
}

