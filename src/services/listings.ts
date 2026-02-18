import { supabase } from '../lib/supabase';
import { Draft, Favorite, Listing, ListingInput, Rating } from '../types';

export async function createListing(input: ListingInput): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert([input])
    .select('*')
    .single();

  if (error) throw error;
  return data as Listing;
}

/** Fetch all listings EXCEPT those belonging to the current user */
export async function fetchListings(): Promise<Listing[]> {
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (user) {
    query = query.neq('seller_id', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
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

  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function updateListing(id: string, input: Partial<ListingInput>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('listings')
    .update(input)
    .eq('id', id)
    .eq('seller_id', user.id);

  if (error) throw error;
}

// ─── Drafts ──────────────────────────────────────────────────────────────────

export async function fetchDrafts(): Promise<Draft[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Draft[];
}

export async function saveDraft(draft: {
  id?: string;
  draft_name: string;
  title: string;
  author: string;
  description: string;
  condition: string;
  price: string;
  photos: string[];
  cover_index: number;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Inicia sesión para guardar borradores');

  const payload: any = {
    user_id: user.id,
    draft_name: draft.draft_name,
    title: draft.title,
    author: draft.author,
    description: draft.description,
    condition: draft.condition,
    price: draft.price,
    photos: draft.photos,
    cover_index: draft.cover_index,
    updated_at: new Date().toISOString(),
  };

  if (draft.id) payload.id = draft.id;

  const { error } = await supabase.from('drafts').upsert(payload);
  if (error) throw error;
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function fetchFavoriteIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return (data ?? []).map((f: any) => f.listing_id);
}

export async function fetchFavorites(): Promise<Listing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id, listings(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((f: any) => f.listings).filter(Boolean) as Listing[];
}

export async function toggleFavorite(listingId: string, isFav: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  if (isFav) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, listing_id: listingId }]);
    if (error) throw error;
  }
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export async function fetchSellerRating(sellerId: string): Promise<{ avg: number; count: number }> {
  const { data, error } = await supabase
    .from('ratings')
    .select('stars')
    .eq('seller_id', sellerId);

  if (error || !data || data.length === 0) return { avg: 0, count: 0 };

  const avg = data.reduce((sum: number, r: any) => sum + r.stars, 0) / data.length;
  return { avg: Math.round(avg * 10) / 10, count: data.length };
}

export async function submitRating(sellerId: string, listingId: string, stars: number, comment: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('ratings')
    .upsert({
      reviewer_id: user.id,
      seller_id: sellerId,
      listing_id: listingId,
      stars,
      comment,
    });

  if (error) throw error;
}
