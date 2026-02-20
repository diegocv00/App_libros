import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Image,
    Modal,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchMessages, sendMessage, markAsRead, reportContent } from '../services/chat';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../types';
import { chatStyles } from '../styles/chatStyles';

export function ChatScreen({ route }: any) {
    const { conversation } = route.params;
    const navigation = useNavigation();

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');

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

            // Configurar el canal de Supabase
            channel = supabase
                .channel(`chat_${conversation.id}`)
                // Escuchar nuevos mensajes (INSERT)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
                    (payload) => {
                        setMessages((current) => {
                            if (current.find(m => m.id === payload.new.id)) return current;
                            return [...current, payload.new as Message];
                        });
                        // Si el mensaje es de la otra persona, marcarlo como leído inmediatamente
                        if (payload.new.sender_id !== currentId) {
                            markAsRead(conversation.id);
                        }
                    }
                )
                // NUEVO: Escuchar actualizaciones de mensajes (UPDATE) para cambiar el "visto" en tiempo real
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
                    (payload) => {
                        setMessages((current) =>
                            current.map(msg => msg.id === payload.new.id ? (payload.new as Message) : msg)
                        );
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

    const handleReport = async () => {
        if (!reportReason.trim()) {
            Alert.alert('Error', 'Por favor, describe el motivo del reporte.');
            return;
        }
        try {
            await reportContent({
                reported_user_id: otherProfile?.id || conversation.seller_id,
                reason: reportReason,
            });
            Alert.alert('Reporte enviado', 'Hemos recibido tu reporte y revisaremos el caso lo antes posible.');
            setIsReportModalVisible(false);
            setReportReason('');
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el reporte. Inténtalo de nuevo.');
        }
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <SafeAreaView style={chatStyles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <KeyboardAvoidingView
                style={chatStyles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* ENCABEZADO */}
                <View style={chatStyles.customHeader}>
                    <Pressable onPress={() => navigation.goBack()} style={chatStyles.backBtn}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#64748b" />
                    </Pressable>

                    {/* FOTO DE PERFIL CORREGIDA */}
                    <View style={chatStyles.avatarContainer}>
                        {otherProfile?.avatar_url && otherProfile.avatar_url.startsWith('http') ? (
                            <Image
                                source={{ uri: otherProfile.avatar_url }}
                                style={chatStyles.avatarImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <MaterialIcons name="person" size={24} color="#94a3b8" />
                        )}
                    </View>

                    <View style={chatStyles.headerInfo}>
                        <Text style={chatStyles.headerName}>
                            {otherProfile?.full_name || 'Usuario'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="menu-book" size={12} color="#1D61FF" style={{ marginRight: 4 }} />
                            <Text style={chatStyles.headerBook} numberOfLines={1}>
                                {userId === conversation.seller_id ? 'Comprador' : 'Vendedor'} • {conversation.listing?.title}
                            </Text>
                        </View>
                    </View>

                    <Pressable onPress={() => setIsReportModalVisible(true)} style={chatStyles.headerRightBtn}>
                        <MaterialIcons name="more-vert" size={24} color="#64748b" />
                    </Pressable>
                </View>

                {/* MODAL DE REPORTE */}
                <Modal visible={isReportModalVisible} transparent animationType="slide" onRequestClose={() => setIsReportModalVisible(false)}>
                    <KeyboardAvoidingView style={chatStyles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={chatStyles.modalContent}>
                            <Text style={chatStyles.modalTitle}>Reportar a {otherProfile?.full_name || 'este usuario'}</Text>
                            <TextInput
                                style={chatStyles.reportInput}
                                placeholder="Describe el comportamiento inadecuado..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                value={reportReason}
                                onChangeText={setReportReason}
                            />
                            <Pressable style={chatStyles.reportBtn} onPress={handleReport}>
                                <Text style={chatStyles.reportBtnText}>Enviar reporte</Text>
                            </Pressable>
                            <Pressable style={chatStyles.cancelBtn} onPress={() => { setIsReportModalVisible(false); setReportReason(''); }}>
                                <Text style={chatStyles.cancelBtnText}>Cancelar</Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* LISTA DE MENSAJES */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={chatStyles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === userId;
                        return (
                            <View style={chatStyles.messageWrapper}>
                                <View style={[chatStyles.bubble, isMe ? chatStyles.myBubble : chatStyles.theirBubble]}>
                                    <Text style={[chatStyles.msgText, isMe && { color: '#ffffff' }]}>
                                        {item.content}
                                    </Text>
                                </View>

                                {/* SISTEMA DE VISTO DINÁMICO */}
                                {isMe ? (
                                    <View style={chatStyles.myTimeContainer}>
                                        <Text style={chatStyles.timeText}>{formatTime(item.created_at)}</Text>
                                        <MaterialIcons
                                            name="done-all"
                                            size={14}
                                            // NUEVO: Gris si is_read es false, Azul si is_read es true
                                            color={item.is_read ? "#1D61FF" : "#94a3b8"}
                                            style={{ marginLeft: 2 }}
                                        />
                                    </View>
                                ) : (
                                    <Text style={[chatStyles.timeText, chatStyles.theirTimeText]}>
                                        {formatTime(item.created_at)}
                                    </Text>
                                )}
                            </View>
                        );
                    }}
                />

                {/* ÁREA DE ENTRADA DE TEXTO */}
                <View style={chatStyles.inputArea}>
                    <TextInput
                        style={chatStyles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#94a3b8"
                        multiline
                    />
                    <Pressable onPress={handleSend} style={chatStyles.sendBtn}>
                        <MaterialIcons
                            name="send"
                            size={20}
                            color="#ffffff"
                            style={{ transform: [{ rotate: '-45deg' }], marginLeft: 4, marginBottom: 2 }}
                        />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}