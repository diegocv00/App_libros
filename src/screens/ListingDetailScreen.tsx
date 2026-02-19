import React from 'react';
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

const { width } = Dimensions.get('window');

export function ListingDetailScreen({ route, navigation }: any) {
    // ✅ Obtenemos los datos del libro pasados por la navegación
    const { listing } = route.params;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `¡Mira este libro en App Libros!: ${listing.title} por ${formatCurrency(listing.price)}`,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
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
                        <View style={styles.specItem}>
                            <MaterialIcons name="location-on" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Ubicación: En línea</Text>
                        </View>
                        <View style={styles.specItem}>
                            <MaterialIcons name="event" size={18} color={colors.primary} />
                            <Text style={styles.specText}>Publicado: Hoy</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Perfil del Vendedor (Simulado por ahora) */}
                    <View style={styles.sellerCard}>
                        <View style={styles.sellerAvatar}>
                            <MaterialIcons name="person" size={30} color={colors.muted} />
                        </View>
                        <View style={styles.sellerInfo}>
                            <Text style={styles.sellerName}>Vendedor de App Libros</Text>
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
                    style={styles.buyBtn}
                    onPress={() => Alert.alert('Próximamente', 'La función de chat y compra estará disponible pronto.')}
                >
                    <MaterialIcons name="chat" size={20} color="#fff" />
                    <Text style={styles.buyBtnText}>Contactar al vendedor</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerActions: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    circleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    image: {
        width: width,
        height: width * 1.2,
        backgroundColor: '#f1f5f9',
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    mainInfo: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 32,
    },
    author: {
        fontSize: 18,
        color: colors.muted,
        marginTop: 4,
        fontWeight: '500',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    price: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.primary,
    },
    conditionBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.md,
    },
    conditionText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: colors.text,
        opacity: 0.8,
    },
    specsContainer: {
        marginTop: spacing.lg,
        gap: 12,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    specText: {
        fontSize: 14,
        color: colors.muted,
        fontWeight: '500',
    },
    sellerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sellerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sellerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    sellerRating: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: 34, // Espacio para el home indicator de iOS
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    buyBtn: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});