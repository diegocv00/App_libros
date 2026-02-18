import { supabase } from '../lib/supabase';
import { Community, CommunityInput, CommunityPost, CommunityPostInput } from '../types';

export async function createCommunity(input: CommunityInput): Promise<Community> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('communities')
    .insert([{ ...input, creator_id: user?.id }])
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

export async function deleteCommunity(id: string): Promise<void> {
  const { error } = await supabase
    .from('communities')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function createPost(input: CommunityPostInput): Promise<CommunityPost> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes estar autenticado para publicar.');
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert([{ ...input, user_id: user.id }])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CommunityPost;
}

export async function fetchPostsByCommunity(communityId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CommunityPost[];
}
// 6. ELIMINAR POST
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    throw error;
  }
}
// OBTENER UNA COMUNIDAD POR ID (Útil para recargar datos tras editar)
export async function fetchCommunityById(id: string): Promise<Community> {
  const { data, error } = await supabase.from('communities').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Community;
}

// ACTUALIZAR COMUNIDAD
export async function updateCommunity(id: string, updates: Partial<CommunityInput & { photo_url: string | null }>): Promise<Community> {
  const { data, error } = await supabase.from('communities').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Community;
}

// DAR PERMISOS DE ADMIN
export async function addCommunityAdmin(communityId: string, currentAdmins: string[], newAdminId: string): Promise<void> {
  const updatedAdmins = [...(currentAdmins || []), newAdminId];
  const { error } = await supabase.from('communities').update({ admin_ids: updatedAdmins }).eq('id', communityId);
  if (error) throw error;
}