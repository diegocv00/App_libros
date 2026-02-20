import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchMessages, sendMessage, markAsRead } from '../services/chat';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../types';
import { colors, radius, spacing } from '../theme';
import { chatStyles as styles, chatStyles } from '../styles/chatStyles';

export function ChatScreen({ route }: any) {
    const { conversation } = route.params;
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        let channel: any;

        const setupChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const currentId = user?.id || null;
            setUserId(currentId);

            const otherUserId = currentId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;

            if (otherUserId) {
                const { data: freshProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single();

                if (freshProfile) {
                    setOtherProfile(freshProfile);
                } else {
                    setOtherProfile(currentId === conversation.buyer_id ? conversation.seller_profile : conversation.buyer_profile);
                }
            }

            await markAsRead(conversation.id);
            await loadMessages();

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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            <KeyboardAvoidingView
                style={chatStyles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* El Header se mueve aquí adentro para que se redimensione junto con el flex area */}
                <View style={styles.customHeader}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>
                            {otherProfile?.full_name || otherProfile?.full_name || 'Usuario'}
                        </Text>
                        <Text style={styles.headerBook} numberOfLines={1}>
                            <MaterialIcons name="menu-book" size={12} color={colors.muted} /> {conversation.listing?.title}
                        </Text>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => (
                        <View style={[styles.bubble, item.sender_id === userId ? styles.myBubble : styles.theirBubble]}>
                            <Text style={[styles.msgText, item.sender_id === userId && { color: '#fff' }]}>{item.content}</Text>
                        </View>
                    )}
                />

                <View style={chatStyles.inputArea}>
                    <TextInput
                        style={chatStyles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={colors.muted}
                        multiline
                    />
                    <Pressable onPress={handleSend} style={chatStyles.sendBtn}>
                        <MaterialIcons name="send" size={24} color="#ffffff" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

