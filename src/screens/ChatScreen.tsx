import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchMessages, sendMessage } from '../services/chat';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { colors, spacing, radius } from '../theme';

export function ChatScreen({ route }: any) {
    const { conversation } = route.params;
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    // src/screens/ChatScreen.tsx

    useEffect(() => {
        let channel: any;

        const setupChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);

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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
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
    );
}

const styles = StyleSheet.create({
    bubble: { padding: 12, borderRadius: radius.lg, marginBottom: 8, maxWidth: '80%' },
    myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
    theirBubble: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
    msgText: { fontSize: 16, color: colors.text },
    inputContainer: { flexDirection: 'row', padding: spacing.md, backgroundColor: '#fff', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
    sendBtn: { padding: 5 }
});