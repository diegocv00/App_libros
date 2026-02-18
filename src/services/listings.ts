import { supabase } from '../lib/supabase';
import { Listing, ListingInput } from '../types';

export async function createListing(input: ListingInput): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert([input])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Listing;
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Listing[];
}

export async function fetchMyListings(): Promise<Listing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Listing[];
}

export async function fetchSavedListings(): Promise<Listing[]> {
  // This would join with favorites table in a real scenario
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .limit(5);

  if (error) {
    throw error;
  }

  return (data ?? []) as Listing[];
}
export async function updateListing(id: string, input: Partial<ListingInput>): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update(input)
    .eq('id', id);

  if (error) {
    throw error;
  }
}
