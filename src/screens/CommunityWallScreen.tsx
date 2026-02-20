import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createPost, fetchPostsByCommunity, deleteCommunity, deletePost, fetchCommunityById, addCommunityAdmin, removeCommunityAdmin, fetchCommunityMembers } from '../services/communities';
import { supabase } from '../lib/supabase';
import { CommunityPost, Community } from '../types';
import { colors, radius, spacing } from '../theme';
import { chatStyles } from '../styles/chatStyles';
import { communityWallStyles as styles } from '../styles/communityWallStyles';

export function CommunityWallScreen({ route, navigation }: any) {
    const insets = useSafeAreaInsets();

    const [community, setCommunity] = useState<Community>(route.params.community);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

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

    const showCommunityMenu = () => {
        const options: any[] = [
            { text: 'Editar Comunidad', onPress: () => navigation.navigate('EditCommunity', { community }) }
        ];

        if (isCreator) {
            options.push({ text: 'Gestionar administradores', onPress: () => setShowAdminModal(true) });
            options.push({
                text: 'Eliminar comunidad',
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
        // Solo edges top: el bottom lo manejamos nosotros con keyboardHeight + insets
        <SafeAreaView style={styles.container} edges={['top']}>

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
                                            {isMemberCreator && (
                                                <Text style={{ fontSize: 12, color: colors.primary }}>Creador</Text>
                                            )}
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

            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <FlatList
                    data={posts}
                    inverted
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        loading
                            ? <ActivityIndicator color={colors.primary} />
                            : <Text style={styles.emptyText}>Sé el primero en publicar.</Text>
                    }
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
                                                {item.user_id === community.creator_id
                                                    ? ' (Creador)'
                                                    : (community.admin_ids || []).includes(item.user_id)
                                                        ? ' (Admin)'
                                                        : ''}
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

                <View style={chatStyles.inputArea}>
                    <TextInput
                        style={chatStyles.input}
                        placeholder="Escribe algo a la comunidad..."
                        placeholderTextColor={colors.muted}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <Pressable
                        style={[chatStyles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={sending || !text.trim()}
                    >
                        {sending
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <MaterialIcons name="send" size={24} color="#ffffff" />
                        }
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

