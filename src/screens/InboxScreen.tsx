import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
// ✅ Importación correcta para evitar el Warning de SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { fetchUserConversations, deleteConversation } from '../services/chat';
import { Conversation } from '../types';
import { colors, spacing, radius } from '../theme';
import { inboxStyles as styles } from '../styles/inboxStyles';

type ConversationWithUnread = Conversation & { unread_count: number };

export function InboxScreen() {
    const navigation = useNavigation<any>();
    const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Se ejecuta cada vez que la pantalla gana el foco (al entrar o volver del chat)
    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [])
    );

    const loadConversations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            const data = await fetchUserConversations();
            // Cast a ConversationWithUnread porque el servicio ahora incluye ese conteo
            setConversations(data as ConversationWithUnread[]);
        } catch (error) {
            console.error("Error al cargar chats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Eliminar conversación",
            "¿Estás seguro de que quieres eliminar este chat? No podrás recuperar los mensajes.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteConversation(id);
                            setConversations(current => current.filter(c => c.id !== id));
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar la conversación.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: ConversationWithUnread }) => {
        const isBuyer = currentUserId === item.buyer_id;
        const otherProfile = isBuyer ? item.seller_profile : item.buyer_profile;

        return (
            <Pressable
                style={styles.convCard}
                onPress={() => navigation.navigate('Chat', { conversation: item })}
                onLongPress={() => handleDelete(item.id)}
            >
                <Image
                    source={{
                        uri: item.listing?.photo_url || 'https://via.placeholder.com/150'
                    }}
                    style={styles.bookImage}
                />

                <View style={styles.info}>
                    <Text style={styles.name}>{otherProfile?.full_name || 'Usuario'}</Text>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                        <MaterialIcons name="menu-book" size={12} color={colors.muted} /> {item.listing?.title}
                    </Text>
                </View>

                <View style={styles.rightContent}>
                    {/* El círculo rojo del chat individual */}
                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                                {item.unread_count > 9 ? '9+' : item.unread_count}
                            </Text>
                        </View>
                    )}
                    <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        // ✅ edges={['bottom']} permite que el header de navegación maneje el tope y nosotros el fondo
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={64} color={colors.muted} />
                    <Text style={styles.emptyText}>No tienes mensajes aún.</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

