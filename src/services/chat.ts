import { supabase } from '../lib/supabase';
import { Conversation, Message, ReportInput } from '../types';

// 1. OBTENER O CREAR UNA CONVERSACIÓN
// Se asegura de traer los perfiles del comprador y vendedor para mostrar los nombres
export async function getOrCreateConversation(listingId: string, sellerId: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Debes estar autenticado para iniciar un chat.');

    if (user.id === sellerId) {
        throw new Error('No puedes iniciar un chat contigo mismo.');
    }

    // Intentar buscar una conversación existente para este libro entre estos dos usuarios
    const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select(`
      *,
      listing:listings(title, photo_url),
      buyer_profile:profiles!buyer_id(id, full_name, avatar_url),
      seller_profile:profiles!seller_id(id, full_name, avatar_url)
    `)
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .maybeSingle();

    if (existing) return existing as Conversation;

    // Si no existe, crear una nueva
    const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert([
            {
                listing_id: listingId,
                buyer_id: user.id,
                seller_id: sellerId,
            },
        ])
        .select(`
      *,
      listing:listings(title, photo_url),
      buyer_profile:profiles!buyer_id(id, full_name, avatar_url),
      seller_profile:profiles!seller_id(id, full_name, avatar_url)
    `)
        .single();

    if (insertError) throw insertError;
    return newConv as Conversation;
}

// 2. OBTENER MENSAJES DE UNA CONVERSACIÓN
export async function fetchMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// 3. ENVIAR UN MENSAJE
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim(),
            },
        ])
        .select('*')
        .single();

    if (error) throw error;
    return data as Message;
}

// 4. MARCAR MENSAJES COMO LEÍDOS
export async function markAsRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
}

// 5. SISTEMA DE REPORTES (Mensajes o Usuarios)
export async function reportContent(input: ReportInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('reports')
        .insert([
            {
                reporter_id: user?.id,
                reported_user_id: input.reported_user_id,
                message_id: input.message_id || null,
                reason: input.reason,
                status: 'pending'
            },
        ]);

    if (error) throw error;
}

// 6. OBTENER LISTA DE CHATS DEL USUARIO (Para una bandeja de entrada)
export async function fetchUserConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('conversations')
        .select(`
      *,
      listing:listings(title, photo_url),
      buyer_profile:profiles!buyer_id(id, full_name, avatar_url),
      seller_profile:profiles!seller_id(id, full_name, avatar_url)
    `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Conversation[];
}

// 7. NUEVA FUNCIÓN: Obtener conteo de mensajes no leídos globalmente
export async function getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Solo contará los mensajes no leídos de los que tú NO seas el remitente
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id);

    if (error) return 0;
    return count || 0;
}