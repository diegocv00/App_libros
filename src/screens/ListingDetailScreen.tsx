import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
    Dimensions,
    Share,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { getOrCreateConversation } from '../services/chat';
import { listingDetailStyles as styles } from '../styles/listingDetailStyles';

export function ListingDetailScreen({ route, navigation }: any) {
    const { listing } = route.params;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [sellerProfile, setSellerProfile] = useState<any>(null);

    useEffect(() => {
        // 1. Obtenemos el usuario actual para saber si es el dueño del libro
        supabase.auth.getUser().then(({ data }) => {
            const userId = data.user?.id || null;
            setCurrentUserId(userId);
            setIsOwner(userId === listing.seller_id);
        });

        // 2. Buscamos la información real del vendedor
        const fetchSellerProfile = async () => {
            if (listing.seller_id) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', listing.seller_id)
                    .single();

                if (data) {
                    setSellerProfile(data);
                }
            }
        };

        fetchSellerProfile();
    }, [listing.seller_id]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `¡Mira este libro en App Libros!: ${listing.title} por ${formatCurrency(listing.price)}`,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleContactSeller = async () => {
        try {
            if (!currentUserId) {
                Alert.alert('Inicia sesión', 'Debes estar identificado para realizar esta acción.');
                return;
            }

            if (isOwner) {
                // Si es el dueño, redirigimos a edición en lugar de chat
                navigation.navigate('EditListing', { listing });
                return;
            }

            // Llamamos al servicio para obtener o crear la conversación
            const conversation = await getOrCreateConversation(listing.id, listing.seller_id);

            // Navegamos a la pantalla de Chat
            navigation.navigate('Chat', { conversation });

        } catch (error: any) {
            Alert.alert('Error', 'No se pudo iniciar la acción: ' + error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Botón de retroceso personalizado sobre la imagen */}
            <View style={styles.headerActions}>
                <Pressable
                    style={styles.circleBtn}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>

                <Pressable style={styles.circleBtn} onPress={handleShare}>
                    <MaterialIcons name="share" size={22} color={colors.text} />
                </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Imagen de Portada */}
                <Image
                    source={{ uri: listing.photo_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop' }}
                    style={styles.image}
                    resizeMode="cover"
                />

                <View style={styles.content}>
                    {/* Título y Autor */}
                    <View style={styles.mainInfo}>
                        <Text style={styles.title}>{listing.title}</Text>
                        <Text style={styles.author}>de {listing.author}</Text>
                    </View>

                    {/* Precio y Estado */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatCurrency(listing.price)}</Text>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionText}>{listing.condition}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Detalles del Libro */}
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>
                        {listing.description || 'El vendedor no ha proporcionado una descripción detallada para este ejemplar.'}
                    </Text>

                    {/* Ficha técnica rápida */}
                    <View style={styles.specsContainer}>
                        {/* ✅ NUEVO: Categoría */}
                        <View style={styles.specItem}>
                            <MaterialIcons name="category" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Categoría: {listing.category || 'Todo'}</Text>
                        </View>

                        {/* ✅ NUEVO: Stock */}
                        <View style={styles.specItem}>
                            <MaterialIcons name="inventory" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Stock disponible: {listing.stock || 1} {listing.stock === 1 ? 'unidad' : 'unidades'}</Text>
                        </View>

                        <View style={styles.specItem}>
                            <MaterialIcons name="location-on" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Ubicación: {listing.location || 'No especificada'}</Text>
                        </View>
                        <View style={styles.specItem}>
                            <MaterialIcons name="event" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Publicado: {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Desconocida'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Perfil del Vendedor */}
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerAvatar}>
                            <MaterialIcons name="person" size={30} color={colors.muted} />
                        </View>
                        <View style={styles.sellerInfo}>
                            {/* ✅ NUEVO: Nombre real del vendedor o su nombre de usuario */}
                            <Text style={styles.sellerName}>
                                {isOwner
                                    ? "Tú eres el vendedor"
                                    : (sellerProfile?.full_name || sellerProfile?.name || "Vendedor de App Libros")
                                }
                            </Text>
                            <Text style={styles.sellerRating}>
                                <MaterialIcons name="star" size={14} color="#f59e0b" /> 4.8 (12 ventas)
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Botón de Acción Fijo abajo */}
            <View style={styles.footer}>
                <Pressable
                    // ✅ NUEVO: Botón azul si es el dueño
                    style={[styles.buyBtn, isOwner && { backgroundColor: '#3b82f6' }]}
                    onPress={handleContactSeller}
                >
                    <MaterialIcons name={isOwner ? "edit" : "chat"} size={20} color="#fff" />
                    <Text style={styles.buyBtnText}>
                        {isOwner ? "Gestionar publicación" : "Contactar al vendedor"}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

