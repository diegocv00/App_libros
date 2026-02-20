import { supabase } from '../lib/supabase';
import { Community, CommunityInput, CommunityPost, CommunityPostInput } from '../types';

// 1. CREAR COMUNIDAD
export async function createCommunity(input: CommunityInput): Promise<Community> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('communities')
    .insert([{ ...input, creator_id: user?.id }])
    .select('*')
    .single();

  if (error) throw error;
  return data as Community;
}

// 2. OBTENER TODAS LAS COMUNIDADES
export async function fetchCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Community[];
}

// 3. ELIMINAR COMUNIDAD
export async function deleteCommunity(id: string): Promise<void> {
  const { error } = await supabase
    .from('communities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 4. CREAR POST (Ahora devuelve el perfil del autor para actualizar la lista al instante)
export async function createPost(input: CommunityPostInput): Promise<CommunityPost> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('community_posts')
    .insert([{ ...input, user_id: user.id }])
    .select('*, profiles(full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data as CommunityPost;
}

// 5. OBTENER POSTS POR COMUNIDAD (Incluye el nombre del autor)
export async function fetchPostsByCommunity(communityId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, profiles(full_name, avatar_url)') // Realizamos el join aquí
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CommunityPost[];
}

// 6. ELIMINAR POST
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

// 7. OBTENER UNA COMUNIDAD POR ID
export async function fetchCommunityById(id: string): Promise<Community> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Community;
}

// 8. ACTUALIZAR COMUNIDAD
export async function updateCommunity(id: string, updates: Partial<CommunityInput & { photo_url: string | null }>): Promise<Community> {
  const { data, error } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Community;
}

// 9. GESTIÓN DE ADMINISTRADORES
export async function addCommunityAdmin(communityId: string, currentAdmins: string[], newAdminId: string): Promise<void> {
  const updatedAdmins = [...(currentAdmins || []), newAdminId];
  const { error } = await supabase
    .from('communities')
    .update({ admin_ids: updatedAdmins })
    .eq('id', communityId);
  if (error) throw error;
}

export async function removeCommunityAdmin(communityId: string, currentAdmins: string[], adminToRemoveId: string): Promise<void> {
  const updatedAdmins = (currentAdmins || []).filter(id => id !== adminToRemoveId);
  const { error } = await supabase
    .from('communities')
    .update({ admin_ids: updatedAdmins })
    .eq('id', communityId);
  if (error) throw error;
}

// 10. OBTENER MIEMBROS (Modificado para asegurar que aparezcan usuarios para el modal de admin)
export async function fetchCommunityMembers(communityId: string) {
  // Si usas una tabla de unión 'community_members':
  const { data, error } = await supabase
    .from('community_members')
    .select('user_id, profiles(id, full_name, avatar_url)')
    .eq('community_id', communityId);

  // Si el resultado es vacío porque aún no has implementado la lógica de "Unirse", 
  // podrías temporalmente traer todos los perfiles para poder probar la función de admin:
  if (!data || data.length === 0) {
    const { data: allProfiles, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url');
    if (profError) throw profError;
    // Adaptamos el formato para que el componente no rompa
    return allProfiles.map(p => ({ user_id: p.id, profiles: p }));
  }

  if (error) throw error;
  return data;
}

// Añade esta función a tu archivo communities.ts
export async function joinCommunity(communityId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes estar autenticado');

  const { error } = await supabase
    .from('community_members')
    .insert([{
      community_id: communityId,
      user_id: user.id
    }]);

  // Si el error es por duplicado (P23505), lo ignoramos porque ya es miembro
  if (error && error.code !== '23505') throw error;
}

export async function removeMember(communityId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);

  if (error) throw error;
}