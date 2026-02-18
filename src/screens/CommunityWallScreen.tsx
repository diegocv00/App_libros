import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createPost, fetchPostsByCommunity, deleteCommunity, deletePost, fetchCommunityById, addCommunityAdmin } from '../services/communities';
import { supabase } from '../lib/supabase';
import { CommunityPost, Community } from '../types';
import { colors, radius, spacing } from '../theme';

export function CommunityWallScreen({ route, navigation }: any) {
    const [community, setCommunity] = useState<Community>(route.params.community);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    // Recarga los datos al volver (por si editaste el grupo)
    useFocusEffect(
        useCallback(() => {
            fetchCommunityById(community.id).then(updated => {
                setCommunity(updated);
                navigation.setOptions({ headerTitle: updated.name });
            });
            loadPosts();
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

    const loadPosts = async () => {
        try {
            const data = await fetchPostsByCommunity(community.id);
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally { setLoading(false); }
    };

    const showCommunityMenu = () => {
        const options: any[] = [
            { text: 'Editar Comunidad', onPress: () => navigation.navigate('EditCommunity', { community }) }
        ];

        // Solo el creador supremo puede dar permisos a otros
        if (isCreator) {
            options.push({ text: 'Dar permisos de Admin', onPress: () => setShowAdminModal(true) });
            options.push({
                text: 'Eliminar Comunidad', style: 'destructive',
                onPress: () => {
                    Alert.alert('Confirmación', '¿Seguro que deseas eliminar TODA la comunidad?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Eliminar', style: 'destructive', onPress: async () => {
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

    const handleMakeAdmin = async (userId: string) => {
        try {
            await addCommunityAdmin(community.id, community.admin_ids || [], userId);
            Alert.alert('Éxito', 'El usuario ahora es administrador.');
            setShowAdminModal(false);
            setCommunity(await fetchCommunityById(community.id));
        } catch (err) {
            Alert.alert('Error', 'No se pudieron dar permisos.');
        }
    };

    // Extraemos usuarios únicos del chat para el modal de admins (excluyéndote a ti y a los que ya son admin)
    const candidateUsers = Array.from(new Set(posts.map(p => p.user_id)))
        .filter(id => id !== currentUserId && !(community.admin_ids || []).includes(id));

    const handleDeletePost = (postId: string) => {
        Alert.alert('Eliminar publicación', '¿Seguro que quieres borrar este mensaje?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await deletePost(postId);
                    setPosts(prev => prev.filter(p => p.id !== postId));
                }
            }
        ]);
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            const newPost = await createPost({ community_id: community.id, content: text.trim(), image_url: null });
            setPosts([newPost, ...posts]);
            setText('');
        } finally { setSending(false); }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={posts}
                inverted
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>Sé el primero en publicar.</Text>}
                renderItem={({ item }) => {
                    const canDeletePost = item.user_id === currentUserId || isAdmin;

                    return (
                        <View style={styles.postCard}>
                            <View style={styles.postHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons name="person" size={20} color={(community.admin_ids || []).includes(item.user_id) || item.user_id === community.creator_id ? colors.primary : colors.muted} />
                                    <Text style={styles.postDate}>
                                        {item.user_id === community.creator_id ? '(Creador) ' : (community.admin_ids || []).includes(item.user_id) ? '(Admin) ' : ''}
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                {canDeletePost && (
                                    <Pressable onPress={() => handleDeletePost(item.id)}>
                                        <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                                    </Pressable>
                                )}
                            </View>
                            <Text style={styles.postContent}>{item.content}</Text>
                        </View>
                    );
                }}
            />

            {/* Modal para elegir nuevos Admins (Basado en usuarios que han comentado) */}
            <Modal visible={showAdminModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nombrar Administrador</Text>
                        <Text style={{ marginBottom: 15, color: colors.muted }}>Selecciona un miembro que haya publicado en el muro:</Text>

                        {candidateUsers.length === 0 ? (
                            <Text style={{ textAlign: 'center', marginVertical: 20 }}>Nadie más ha publicado aún o todos ya son administradores.</Text>
                        ) : (
                            candidateUsers.map(uid => (
                                <Pressable key={uid} style={styles.adminCandidateRow} onPress={() => handleMakeAdmin(uid)}>
                                    <MaterialIcons name="person" size={24} color={colors.text} />
                                    <Text style={styles.adminCandidateText}>Usuario: {uid.substring(0, 8)}...</Text>
                                    <MaterialIcons name="add-moderator" size={24} color={colors.primary} />
                                </Pressable>
                            ))
                        )}

                        <Pressable style={[styles.sendButton, { width: '100%', marginTop: 20 }]} onPress={() => setShowAdminModal(false)}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder="Escribe algo a la comunidad..." value={text} onChangeText={setText} multiline />
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
    postCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
    postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    postDate: { fontSize: 12, color: colors.muted, fontWeight: '600' },
    postContent: { fontSize: 15, color: colors.text },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
    inputContainer: { flexDirection: 'row', padding: spacing.sm, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border, alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, minHeight: 40, maxHeight: 100 },
    sendButton: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    adminCandidateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    adminCandidateText: { flex: 1, marginLeft: 10, fontSize: 16 }
});