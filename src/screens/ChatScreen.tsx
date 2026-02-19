import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchMessages, sendMessage, markAsRead } from '../services/chat';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../types';
import { colors, spacing, radius } from '../theme';

export function ChatScreen({ route }: any) {
    const { conversation } = route.params;
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

    // src/screens/ChatScreen.tsx

    useEffect(() => {
        let channel: any;

        const setupChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const currentId = user?.id || null;
            setUserId(currentId);

            // Determinar con quién estamos hablando para mostrar su nombre
            if (currentId === conversation.buyer_id) {
                setOtherProfile(conversation.seller_profile || null);
            } else {
                setOtherProfile(conversation.buyer_profile || null);
            }

            // Marcar mensajes como leídos al entrar a la pantalla
            await markAsRead(conversation.id);

            // 1. Cargar mensajes iniciales
            loadMessages();

            // 2. Suscribirse a nuevos mensajes en tiempo real
            channel = supabase
                .channel(`chat_${conversation.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversation.id}`
                    },
                    (payload) => {
                        // Solo añadimos si no está ya en la lista
                        setMessages((current) => {
                            if (current.find(m => m.id === payload.new.id)) return current;
                            return [...current, payload.new as Message];
                        });

                        // Si nos llega un mensaje de la otra persona mientras tenemos el chat abierto, lo marcamos como leído
                        if (payload.new.sender_id !== currentId) {
                            markAsRead(conversation.id);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log("Estado suscripción chat:", status);
                });
        };

        setupChat();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [conversation.id]);

    const loadMessages = async () => {
        const data = await fetchMessages(conversation.id);
        setMessages(data);
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        const msg = text;
        setText('');
        try {
            await sendMessage(conversation.id, msg);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Encabezado Personalizado */}
            <View style={styles.customHeader}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>
                        {otherProfile?.full_name || 'Usuario'}
                    </Text>
                    <Text style={styles.headerBook} numberOfLines={1}>
                        <MaterialIcons name="menu-book" size={12} color={colors.muted} /> {conversation.listing?.title}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing.md }}
                    renderItem={({ item }) => (
                        <View style={[styles.bubble, item.sender_id === userId ? styles.myBubble : styles.theirBubble]}>
                            <Text style={[styles.msgText, item.sender_id === userId && { color: '#fff' }]}>{item.content}</Text>
                        </View>
                    )}
                />
                <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Escribe un mensaje..." multiline />
                    <Pressable onPress={handleSend} style={styles.sendBtn}>
                        <MaterialIcons name="send" size={24} color={colors.primary} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        elevation: 2, // Sombra en Android
        shadowColor: '#000', // Sombra en iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerBook: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    bubble: { padding: 12, borderRadius: radius.lg, marginBottom: 8, maxWidth: '80%' },
    myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
    theirBubble: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
    msgText: { fontSize: 16, color: colors.text },
    inputContainer: { flexDirection: 'row', padding: spacing.md, backgroundColor: '#fff', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
    sendBtn: { padding: 5 }
});