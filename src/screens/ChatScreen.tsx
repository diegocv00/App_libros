import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
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

    useEffect(() => {
        let channel: any;

        const setupChat = async () => {
            // 1. Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            const currentId = user?.id || null;
            setUserId(currentId);

            // 2. Identificar el ID de la otra persona
            const otherUserId = currentId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;

            // 3. CONSULTA FORZADA: Traer el perfil más reciente desde la base de datos
            // Esto garantiza que si el otro usuario cambió su nombre, lo veamos aquí.
            if (otherUserId) {
                const { data: freshProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single();

                if (freshProfile) {
                    setOtherProfile(freshProfile);
                } else {
                    // Respaldo por si la consulta falla
                    setOtherProfile(currentId === conversation.buyer_id ? conversation.seller_profile : conversation.buyer_profile);
                }
            }

            // 4. Marcar como leído y cargar historial
            await markAsRead(conversation.id);
            loadMessages();

            // 5. Suscripción en tiempo real para mensajes nuevos
            channel = supabase
                .channel(`chat_${conversation.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
                    (payload) => {
                        setMessages((current) => {
                            if (current.find(m => m.id === payload.new.id)) return current;
                            return [...current, payload.new as Message];
                        });
                        if (payload.new.sender_id !== currentId) {
                            markAsRead(conversation.id);
                        }
                    }
                )
                .subscribe();
        };

        setupChat();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [conversation.id]); // Se re-ejecuta si cambia la conversación

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
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.customHeader}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>
                        {/* Prioridad: full_name fresco > name fresco > Usuario */}
                        {otherProfile?.full_name || otherProfile?.name || 'Usuario'}
                    </Text>
                    <Text style={styles.headerBook} numberOfLines={1}>
                        <MaterialIcons name="menu-book" size={12} color={colors.muted} /> {conversation.listing?.title}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
            >
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
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Escribe un mensaje..."
                        multiline
                    />
                    <Pressable onPress={handleSend} style={styles.sendBtn}>
                        <MaterialIcons name="send" size={24} color={colors.primary} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: colors.bg,
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