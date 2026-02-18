import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');

export function ListingDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    // Recibimos los datos del libro
    const { listing } = route.params as any;

    // Si el libro tiene el nuevo arreglo de fotos, lo usamos. Si no, usamos el photo_url antiguo.
    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : [listing.photo_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop'];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Detalle del Libro</Text>
                <View style={styles.spacer} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Carrusel horizontal para las 5 fotos */}
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageContainer}
                >
                    {images.map((img: string, index: number) => (
                        <Image
                            key={index.toString()}
                            source={{ uri: img }}
                            style={styles.image}
                        />
                    ))}
                </ScrollView>

                <View style={styles.infoContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{listing.title}</Text>
                        <Text style={styles.price}>{formatCurrency(listing.price)}</Text>
                    </View>

                    <Text style={styles.author}>Por: {listing.author}</Text>

                    {/* Aquí reemplazamos el && por un ternario para evitar el error de crash */}
                    {listing.condition ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Condición: {listing.condition}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>
                        {listing.description ? listing.description : 'Este libro no tiene una descripción detallada.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    spacer: { width: 40 }, // Reemplazamos el comentario que causaba el crash por un View limpio
    imageContainer: { width, height: 350 },
    image: { width, height: 350, backgroundColor: '#e2e8f0', resizeMode: 'cover' },
    infoContainer: { padding: spacing.lg },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, marginRight: 10 },
    price: { fontSize: 24, fontWeight: '900', color: colors.primary },
    author: { fontSize: 16, color: colors.muted, marginBottom: 16 },
    badge: {
        alignSelf: 'flex-start', backgroundColor: colors.primary + '15',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, marginBottom: spacing.lg
    },
    badgeText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, marginTop: 8 },
    description: { fontSize: 15, color: colors.muted, lineHeight: 24 },
});