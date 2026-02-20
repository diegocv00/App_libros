// src/screens/InboxScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchUserConversations, deleteConversation } from '../services/chat';
import { Conversation } from '../types';
import { colors, spacing, radius } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

export function InboxScreen() {
    const navigation = useNavigation<any>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [])
    );

    const loadConversations = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        try {
            const data = await fetchUserConversations();
            setConversations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Eliminar conversación",
            "¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteConversation(id);
                            // Actualizar la lista localmente para que desaparezca de inmediato
                            setConversations(current => current.filter(c => c.id !== id));
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar la conversación.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Conversation }) => {
        const isBuyer = currentUserId === item.buyer_id;
        const otherProfile = isBuyer ? item.seller_profile : item.buyer_profile;

        return (
            <Pressable
                style={styles.convCard}
                onPress={() => navigation.navigate('Chat', { conversation: item })}
                onLongPress={() => handleDelete(item.id)} // ✅ Borrar al mantener presionado
            >
                <Image
                    source={{ uri: item.listing?.photo_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop' }}
                    style={styles.bookImage}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{otherProfile?.full_name || 'Usuario'}</Text>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                        <MaterialIcons name="menu-book" size={12} /> {item.listing?.title}
                    </Text>
                </View>
                <View style={styles.rightIcons}>
                    <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                        <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </Pressable>
                    <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </View>
            </Pressable>
        );
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />;

    return (
        <View style={styles.container}>
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
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    convCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 2
    },
    bookImage: { width: 50, height: 65, borderRadius: radius.sm, marginRight: spacing.md, backgroundColor: '#e2e8f0' },
    info: { flex: 1, justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    bookTitle: { fontSize: 13, color: colors.muted, marginTop: 4 },
    rightIcons: { flexDirection: 'row', alignItems: 'center' },
    deleteBtn: { padding: 10, marginRight: 5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 16, color: colors.muted, fontSize: 16, textAlign: 'center' }
});