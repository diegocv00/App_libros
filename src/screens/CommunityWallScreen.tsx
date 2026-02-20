import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer'; // NUEVA IMPORTACIÓN
import { createPost, fetchPostsByCommunity, deleteCommunity, deletePost, fetchCommunityById, addCommunityAdmin, removeCommunityAdmin, fetchCommunityMembers, removeMember } from '../services/communities';
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    useEffect(() => {
        // Creamos un nombre de canal único para esta comunidad
        const channel = supabase
            .channel(`realtime_community_${community.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchamos TODO: INSERT, UPDATE y DELETE
                    schema: 'public',
                    table: 'community_posts',
                    filter: `community_id=eq.${community.id}`
                },
                async (payload) => {
                    console.log("Cambio recibido en Realtime:", payload);

                    if (payload.eventType === 'INSERT') {
                        // Traemos el perfil del autor para el nuevo mensaje
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', payload.new.user_id)
                            .single();

                        const postWithProfile = {
                            ...payload.new,
                            profiles: profile ? { full_name: profile.full_name } : undefined
                        } as CommunityPost;

                        setPosts((current) => {
                            if (current.find(p => p.id === postWithProfile.id)) return current;
                            return [postWithProfile, ...current];
                        });
                    }

                    if (payload.eventType === 'DELETE') {
                        // Eliminamos el mensaje de la lista local
                        setPosts((current) => current.filter(p => p.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                console.log("Estado de la suscripción:", status);
            });

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
            fetchCommunityById(community.id).then(updated => setCommunity(updated));
            loadData();
        }, [community.id])
    );

    const isCreator = currentUserId === community.creator_id;
    const isAdmin = isCreator || (community.admin_ids || []).includes(currentUserId || '');

    const showCommunityMenu = () => {
        const options: any[] = [];
        if (isAdmin) {
            options.push({ text: 'Editar Comunidad', onPress: () => navigation.navigate('EditCommunity', { community }) });
            options.push({ text: 'Gestionar miembros', onPress: () => setShowAdminModal(true) });
        }
        if (isCreator) {
            options.push({
                text: 'Eliminar comunidad', style: 'destructive', onPress: () => {
                    Alert.alert('Confirmación', '¿Seguro que deseas eliminar TODA la comunidad?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCommunity(community.id); navigation.goBack(); } }
                    ]);
                }
            });
        }
        options.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Opciones de la Comunidad', '¿Qué deseas hacer?', options);
    };

    const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
        const currentAdmins = community.admin_ids || [];
        const newAdmins = isCurrentlyAdmin ? currentAdmins.filter(id => id !== userId) : [...currentAdmins, userId];
        setCommunity(prev => ({ ...prev, admin_ids: newAdmins }));
        try {
            if (isCurrentlyAdmin) await removeCommunityAdmin(community.id, currentAdmins, userId);
            else await addCommunityAdmin(community.id, currentAdmins, userId);
        } catch (err) {
            setCommunity(prev => ({ ...prev, admin_ids: currentAdmins }));
            Alert.alert('Error', 'No se pudo actualizar los permisos.');
        }
    };

    const handleRemoveMember = (userId: string, userName: string) => {
        Alert.alert('Expulsar miembro', `¿Estás seguro de que deseas expulsar a ${userName}?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Expulsar', style: 'destructive', onPress: async () => {
                    setMembers(prev => prev.filter(m => m.user_id !== userId));
                    try {
                        await removeMember(community.id, userId);
                        if ((community.admin_ids || []).includes(userId)) {
                            await removeCommunityAdmin(community.id, community.admin_ids || [], userId);
                        }
                    } catch (error) {
                        Alert.alert('Error', 'No se pudo expulsar al miembro.');
                        loadData();
                    }
                }
            }
        ]);
    };

    // 1. MODIFICACIÓN DEL MENÚ DE PRESIONADO LARGO
    const handlePostLongPress = (post: CommunityPost) => {
        const isMyMsg = post.user_id === currentUserId;
        const canDelete = isMyMsg || isAdmin;

        // Si es MI mensaje, solo mostrar Eliminar y Cancelar
        if (isMyMsg) {
            Alert.alert('Opciones de mi mensaje', '¿Qué deseas hacer?', [
                {
                    text: 'Eliminar mensaje',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePost(post.id);
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar.');
                        }
                    }
                },
                { text: 'Cancelar', style: 'cancel' }
            ]);
            return;
        }

        // Si NO es mi mensaje, pero soy admin o creador (mostrar Reportar y Eliminar)
        const options: any[] = [{ text: 'Reportar mensaje o usuario', onPress: () => handleReport(post) }];

        if (canDelete) {
            options.push({
                text: 'Eliminar mensaje (Admin)',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deletePost(post.id);
                    } catch (error) {
                        Alert.alert('Error', 'No se pudo eliminar el mensaje.');
                    }
                }
            });
        }
        options.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Opciones de mensaje', 'Selecciona una acción', options);
    };

    // 2. ACTUALIZACIÓN DEL CANAL REALTIME (Asegúrate que se vea así)
    useEffect(() => {
        const channel = supabase
            .channel(`community_${community.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `community_id=eq.${community.id}` },
                async (payload) => {
                    const newPost = payload.new as CommunityPost;
                    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', newPost.user_id).single();
                    const postWithProfile = { ...newPost, profiles: profile ? { full_name: profile.full_name } : undefined };
                    setPosts((current) => [postWithProfile, ...current.filter(p => p.id !== newPost.id)]);
                }
            )
            // ESTE BLOQUE ES EL QUE BORRA PARA TODOS EN TIEMPO REAL
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'community_posts' },
                (payload) => {
                    setPosts((current) => current.filter(p => p.id !== payload.old.id));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'communities', filter: `id=eq.${community.id}` },
                (payload) => setCommunity(payload.new as Community)
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [community.id]);

    const handleReport = (post: CommunityPost) => {
        Alert.alert('Reportar contenido', '¿Por qué deseas reportar este mensaje?', [
            { text: 'Spam', onPress: () => sendReport(post, 'Spam') },
            { text: 'Lenguaje inapropiado', onPress: () => sendReport(post, 'Lenguaje inapropiado') },
            { text: 'Acoso', onPress: () => sendReport(post, 'Acoso') },
            { text: 'Cancelar', style: 'cancel' }
        ]);
    };

    // NUEVO: SISTEMA DE REPORTES POR CORREO
    const sendReport = async (post: CommunityPost, reason: string) => {
        try {
            // 1. Lo registramos en Supabase como siempre
            await supabase.from('reports').insert([{ reporter_id: currentUserId, reported_user_id: post.user_id, message_id: post.id, reason: reason }]);

            // 2. Intentamos abrir el cliente de correo del usuario
            const isAvailable = await MailComposer.isAvailableAsync();
            if (isAvailable) {
                await MailComposer.composeAsync({
                    recipients: ['soporte@tuapplibros.com'], // <-- Cambia esto por tu correo real de soporte
                    subject: `🚨 Reporte en Comunidad: ${community.name}`,
                    body: `Detalles del reporte generado automáticamente:\n\n` +
                        `- Comunidad: ${community.name}\n` +
                        `- Motivo del reporte: ${reason}\n` +
                        `- Mensaje reportado: "${post.content || 'Solo imagen/vacío'}"\n\n` +
                        `-- Datos técnicos (No borrar) --\n` +
                        `Post ID: ${post.id}\n` +
                        `Usuario Reportado ID: ${post.user_id}\n` +
                        `Reportado por ID: ${currentUserId}\n\n` +
                        `Comentarios adicionales (Opcional): `,
                });
            } else {
                Alert.alert('Reporte enviado', 'Hemos guardado tu reporte en el sistema.');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un problema procesando tu reporte.');
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
        if (!result.canceled) setSelectedImage(result.assets[0].uri);
    };

    const handleSend = async () => {
        if (!text.trim() && !selectedImage) return;
        setSending(true);
        try {
            let imageUrlToSave = null;
            if (selectedImage) {
                const fileExt = selectedImage.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
                const response = await fetch(selectedImage);
                const arrayBuffer = await response.arrayBuffer();

                const { error: uploadError } = await supabase.storage
                    .from('community_posts')
                    .upload(fileName, arrayBuffer, { contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}` });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('community_posts').getPublicUrl(fileName);
                imageUrlToSave = data.publicUrl;
            }

            await createPost({ community_id: community.id, content: text.trim(), image_url: imageUrlToSave });
            setText('');
            setSelectedImage(null);
        } catch (err) {
            Alert.alert('Error', 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const filteredMembers = members.filter(m => m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.user_id.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={chatStyles.customHeader}>
                <Pressable onPress={() => navigation.goBack()} style={chatStyles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#64748b" />
                </Pressable>

                <Pressable style={chatStyles.avatarContainer} onPress={() => community.photo_url && setFullScreenImage(community.photo_url)}>
                    {community.photo_url ? (
                        <Image source={{ uri: community.photo_url }} style={chatStyles.avatarImage} resizeMode="cover" />
                    ) : (
                        <MaterialIcons name="groups" size={24} color="#94a3b8" />
                    )}
                </Pressable>

                <View style={chatStyles.headerInfo}>
                    <Text style={chatStyles.headerName} numberOfLines={1}>{community.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={chatStyles.headerBook} numberOfLines={1}>{community.topic} • {members.length} miembros</Text>
                    </View>
                </View>

                {isAdmin && (
                    <Pressable onPress={showCommunityMenu} style={chatStyles.headerRightBtn}>
                        <MaterialIcons name="more-vert" size={24} color="#64748b" />
                    </Pressable>
                )}
            </View>

            <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
                <View style={styles.fullScreenOverlay}>
                    <Pressable style={styles.fullScreenCloseBtn} onPress={() => setFullScreenImage(null)}>
                        <MaterialIcons name="close" size={28} color="#ffffff" />
                    </Pressable>
                    {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImg} resizeMode="contain" />}
                </View>
            </Modal>

            {/* MODAL GESTIONAR MIEMBROS */}
            <Modal visible={showAdminModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Gestionar Miembros</Text>
                            <Pressable onPress={() => setShowAdminModal(false)}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
                        </View>
                        <TextInput style={styles.searchBar} placeholder="Buscar miembro por nombre..." value={searchQuery} onChangeText={setSearchQuery} />
                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.sectionLabel}>Miembros de la comunidad</Text>
                            {filteredMembers.map(member => {
                                const isMemberAdmin = (community.admin_ids || []).includes(member.user_id);
                                const isMemberCreator = member.user_id === community.creator_id;
                                const isMyself = member.user_id === currentUserId;

                                return (
                                    <View key={member.user_id} style={styles.adminCandidateRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.adminCandidateText}>{member.profiles?.full_name || 'Usuario desconocido'} {isMyself ? '(Tú)' : ''}</Text>
                                            {isMemberCreator ? <Text style={{ fontSize: 13, color: colors.primary, fontWeight: 'bold' }}>👑 Creador</Text> : isMemberAdmin ? <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: 'bold' }}>🛡️ Administrador</Text> : null}
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                            {isAdmin && !isMyself && !isMemberCreator && (
                                                <Pressable onPress={() => handleRemoveMember(member.user_id, member.profiles?.full_name || 'Usuario')} style={[styles.actionBtn, { backgroundColor: '#ef4444', paddingHorizontal: 8 }]}>
                                                    <MaterialIcons name="person-remove" size={16} color="#fff" />
                                                </Pressable>
                                            )}
                                            {isCreator && !isMyself && (
                                                <Pressable onPress={() => handleToggleAdmin(member.user_id, isMemberAdmin)} style={[styles.actionBtn, isMemberAdmin ? { backgroundColor: '#fee2e2' } : { backgroundColor: colors.primary + '15' }]}>
                                                    <Text style={[styles.actionBtnText, isMemberAdmin ? { color: '#ef4444' } : { color: colors.primary }]}>{isMemberAdmin ? 'Quitar Admin' : 'Hacer Admin'}</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <Pressable style={styles.closeModalBtn} onPress={() => setShowAdminModal(false)}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Finalizar</Text></Pressable>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
                <FlatList
                    data={posts}
                    inverted
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.emptyText}>Sé el primero en publicar.</Text>}
                    renderItem={({ item }) => {
                        const isMsgAdmin = (community.admin_ids || []).includes(item.user_id) || item.user_id === community.creator_id;
                        return (
                            <Pressable onLongPress={() => handlePostLongPress(item)} delayLongPress={500} style={styles.postCard}>
                                <View style={styles.postHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <MaterialIcons name="person" size={20} color={isMsgAdmin ? colors.primary : colors.muted} />
                                        <View>
                                            <Text style={styles.authorName}>
                                                {item.profiles?.full_name || 'Usuario'}
                                                {item.user_id === community.creator_id ? ' (Creador)' : (community.admin_ids || []).includes(item.user_id) ? ' (Admin)' : ''}
                                            </Text>
                                            <Text style={styles.postDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                </View>

                                {item.image_url && (
                                    <Pressable onPress={() => setFullScreenImage(item.image_url)}>
                                        <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
                                    </Pressable>
                                )}

                                {item.content ? <Text style={styles.postContent}>{item.content}</Text> : null}
                            </Pressable>
                        );
                    }}
                />

                {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                        <View style={styles.imagePreviewWrapper}>
                            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                            <Pressable style={styles.removePreviewBtn} onPress={() => setSelectedImage(null)}>
                                <MaterialIcons name="close" size={16} color="#ffffff" />
                            </Pressable>
                        </View>
                    </View>
                )}

                <View style={chatStyles.inputArea}>
                    <Pressable style={styles.attachBtn} onPress={pickImage} disabled={sending}>
                        <MaterialIcons name="image" size={28} color={colors.muted} />
                    </Pressable>

                    <TextInput
                        style={chatStyles.input}
                        placeholder="Escribe algo..."
                        placeholderTextColor={colors.muted}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />

                    <Pressable
                        style={[chatStyles.sendBtn, (!text.trim() && !selectedImage || sending) && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={sending || (!text.trim() && !selectedImage)}
                    >
                        {sending ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={24} color="#ffffff" />}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}