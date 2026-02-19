import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createPost, fetchPostsByCommunity, deleteCommunity, deletePost, fetchCommunityById, addCommunityAdmin, removeCommunityAdmin, fetchCommunityMembers } from '../services/communities';
import { supabase } from '../lib/supabase';
import { CommunityPost, Community } from '../types';
import { colors, radius, spacing } from '../theme';

export function CommunityWallScreen({ route, navigation }: any) {
    const [community, setCommunity] = useState<Community>(route.params.community);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Estados para gestión de Admins
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    // 1. LÓGICA DE TIEMPO REAL CORREGIDA
    useEffect(() => {
        const channel = supabase
            .channel(`community_${community.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_posts',
                    filter: `community_id=eq.${community.id}`
                },
                async (payload) => {
                    const newPost = payload.new as CommunityPost;

                    // Como el payload de tiempo real no trae el "join" de perfiles, 
                    // buscamos el nombre rápidamente para inyectarlo en la lista.
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', newPost.user_id)
                        .single();

                    const postWithProfile = {
                        ...newPost,
                        profiles: profile ? { full_name: profile.full_name } : undefined
                    };

                    setPosts((current) => {
                        // Evitamos duplicados si el fetch y el insert coinciden
                        if (current.find(p => p.id === newPost.id)) return current;
                        return [postWithProfile, ...current];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [community.id]);

    const loadData = async () => {
        try {
            const [postsData, membersData] = await Promise.all([
                fetchPostsByCommunity(community.id),
                fetchCommunityMembers(community.id)
            ]);
            setPosts(postsData);
            setMembers(membersData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCommunityById(community.id).then(updated => {
                setCommunity(updated);
                navigation.setOptions({ headerTitle: updated.name });
            });
            loadData();
        }, [community.id])
    );

    const isCreator = currentUserId === community.creator_id;
    const isAdmin = isCreator || (community.admin_ids || []).includes(currentUserId || '');

    useEffect(() => {
        navigation.setOptions({
            headerTitle: community.name,
            headerRight: () => isAdmin ? (
                <Pressable onPress={showCommunityMenu} style={{ paddingRight: 10 }}>
                    <MaterialIcons name="more-vert" size={24} color={colors.primary} />
                </Pressable>
            ) : null,
        });
    }, [navigation, currentUserId, community, isAdmin]);

    // 2. CORRECCIÓN ERROR TYPESCRIPT EN ALERT
    const showCommunityMenu = () => {
        const options: any[] = [ // Cast a any[] para evitar error de propiedades conocidas
            { text: 'Editar Comunidad', onPress: () => navigation.navigate('EditCommunity', { community }) }
        ];

        if (isCreator) {
            options.push({ text: 'Gestionar Administradores', onPress: () => setShowAdminModal(true) });
            options.push({
                text: 'Eliminar Comunidad',
                style: 'destructive',
                onPress: () => {
                    Alert.alert('Confirmación', '¿Seguro que deseas eliminar TODA la comunidad?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: async () => {
                                await deleteCommunity(community.id);
                                navigation.goBack();
                            }
                        }
                    ]);
                }
            });
        }
        options.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Opciones de la Comunidad', '¿Qué deseas hacer?', options);
    };

    const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
        try {
            if (isCurrentlyAdmin) {
                await removeCommunityAdmin(community.id, community.admin_ids || [], userId);
                Alert.alert('Éxito', 'Permisos de administrador revocados.');
            } else {
                await addCommunityAdmin(community.id, community.admin_ids || [], userId);
                Alert.alert('Éxito', 'Usuario nombrado administrador.');
            }
            const updated = await fetchCommunityById(community.id);
            setCommunity(updated);
            loadData();
        } catch (err) {
            Alert.alert('Error', 'No se pudo actualizar los permisos.');
        }
    };

    const handlePostLongPress = (post: CommunityPost) => {
        const canDelete = post.user_id === currentUserId || isAdmin;

        const options: any[] = [
            { text: 'Reportar mensaje o usuario', onPress: () => handleReport(post) }
        ];

        if (canDelete) {
            options.push({
                text: 'Eliminar mensaje',
                style: 'destructive',
                onPress: async () => {
                    await deletePost(post.id);
                    setPosts(prev => prev.filter(p => p.id !== post.id));
                }
            });
        }

        options.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Opciones de mensaje', 'Selecciona una acción', options);
    };

    const handleReport = (post: CommunityPost) => {
        const options: any[] = [
            { text: 'Spam', onPress: () => sendReport(post, 'Spam') },
            { text: 'Lenguaje inapropiado', onPress: () => sendReport(post, 'Lenguaje inapropiado') },
            { text: 'Acoso', onPress: () => sendReport(post, 'Acoso') },
            { text: 'Cancelar', style: 'cancel' }
        ];
        Alert.alert('Reportar contenido', '¿Por qué deseas reportar este mensaje?', options);
    };

    const sendReport = async (post: CommunityPost, reason: string) => {
        const { error } = await supabase.from('reports').insert([{
            reporter_id: currentUserId,
            reported_user_id: post.user_id,
            message_id: post.id,
            reason: reason
        }]);

        if (error) Alert.alert('Error', 'No se pudo enviar el reporte.');
        else Alert.alert('Reporte enviado', 'Gracias por ayudarnos a mantener la comunidad segura.');
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            // No necesitamos recargar posts aquí porque el Realtime lo hará automáticamente
            await createPost({ community_id: community.id, content: text.trim(), image_url: null });
            setText('');
        } catch (err) {
            Alert.alert('Error', 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={posts}
                inverted
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>Sé el primero en publicar.</Text>}
                renderItem={({ item }) => {
                    const isMsgAdmin = (community.admin_ids || []).includes(item.user_id) || item.user_id === community.creator_id;

                    return (
                        <Pressable
                            onLongPress={() => handlePostLongPress(item)}
                            delayLongPress={500}
                            style={styles.postCard}
                        >
                            <View style={styles.postHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons
                                        name="person"
                                        size={20}
                                        color={isMsgAdmin ? colors.primary : colors.muted}
                                    />
                                    <View>
                                        <Text style={styles.authorName}>
                                            {item.profiles?.full_name || 'Usuario'}
                                            {item.user_id === community.creator_id ? ' (Creador)' : (community.admin_ids || []).includes(item.user_id) ? ' (Admin)' : ''}
                                        </Text>
                                        <Text style={styles.postDate}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.postContent}>{item.content}</Text>
                        </Pressable>
                    );
                }}
            />

            <Modal visible={showAdminModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Gestionar Administradores</Text>
                            <Pressable onPress={() => setShowAdminModal(false)}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.searchBar}
                            placeholder="Buscar miembro por nombre..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.sectionLabel}>Miembros de la comunidad</Text>
                            {filteredMembers.map(member => {
                                const isMemberAdmin = (community.admin_ids || []).includes(member.user_id);
                                const isMemberCreator = member.user_id === community.creator_id;

                                return (
                                    <View key={member.user_id} style={styles.adminCandidateRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.adminCandidateText}>
                                                {member.profiles?.full_name || 'Usuario desconocido'}
                                            </Text>
                                            {isMemberCreator && <Text style={{ fontSize: 12, color: colors.primary }}>Creador</Text>}
                                        </View>

                                        {!isMemberCreator && (
                                            <Pressable
                                                onPress={() => handleToggleAdmin(member.user_id, isMemberAdmin)}
                                                style={[styles.actionBtn, isMemberAdmin ? styles.removeBtn : styles.addBtn]}
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    {isMemberAdmin ? 'Quitar Admin' : 'Hacer Admin'}
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <Pressable style={styles.closeModalBtn} onPress={() => setShowAdminModal(false)}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Finalizar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe algo a la comunidad..."
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending || !text.trim()}>
                        {sending ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={20} color="#fff" />}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    listContent: { padding: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
    postCard: {
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    authorName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    postDate: { fontSize: 11, color: colors.muted },
    postContent: { fontSize: 15, color: colors.text, lineHeight: 20 },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.sm,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: colors.border,
        alignItems: 'center'
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        minHeight: 40,
        maxHeight: 100
    },
    sendButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '70%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    sectionLabel: { fontSize: 12, fontWeight: 'bold', color: colors.muted, marginBottom: 15, textTransform: 'uppercase' },
    searchBar: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: radius.md,
        marginBottom: 15
    },
    adminCandidateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    adminCandidateText: { fontSize: 16, color: colors.text, fontWeight: '500' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtn: { backgroundColor: colors.primary + '20' },
    removeBtn: { backgroundColor: '#fee2e2' },
    actionBtnText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
    closeModalBtn: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: 20
    }
});