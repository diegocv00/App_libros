import React, { useMemo, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { updateListing } from '../services/listings';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatCurrency, formatInputPrice, cleanPrice } from '../utils/formatters';

const CONDITIONS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable'];

export function EditScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const listing = (route.params as any)?.listing;

    const [form, setForm] = useState({
        title: listing?.title || '',
        author: listing?.author || '',
        description: listing?.description || '',
        condition: listing?.condition || 'Nuevo',
        price: listing ? formatInputPrice(listing.price.toString()) : '',
        photos: listing?.photo_url ? [listing.photo_url] : [],
        coverIndex: 0,
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    if (!listing) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No se encontró el libro para editar.</Text>
                    <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Volver</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const canSubmit = useMemo(() => {
        return form.title.trim().length > 0 && form.price.trim().length > 0;
    }, [form.price, form.title]);

    const updateField = (key: keyof typeof form, value: any) => {
        let finalValue = value;
        if (key === 'price') {
            finalValue = formatInputPrice(value);
        }
        setForm((prev) => ({ ...prev, [key]: finalValue }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setForm(prev => ({
                ...prev,
                photos: [...prev.photos, ...selectedUris]
            }));
        }
    };

    const removePhoto = (index: number) => {
        setForm(prev => {
            const newPhotos = prev.photos.filter((_, i) => i !== index);
            let newCoverIndex = prev.coverIndex;
            if (index === prev.coverIndex) newCoverIndex = 0;
            else if (index < prev.coverIndex) newCoverIndex = prev.coverIndex - 1;
            return { ...prev, photos: newPhotos, coverIndex: Math.max(0, newCoverIndex) };
        });
    };

    const handleSave = async () => {
        setStatus('');
        if (!canSubmit) {
            setStatus('Completa al menos el título y el precio.');
            return;
        }

        const rawPrice = cleanPrice(form.price);
        const priceValue = parseInt(rawPrice, 10);
        if (isNaN(priceValue) || priceValue <= 0) {
            setStatus('El precio debe ser un número válido.');
            return;
        }

        setLoading(true);
        try {
            const listingData = {
                title: form.title.trim(),
                author: form.author.trim() || 'Autor no especificado',
                description: form.description.trim() || 'Sin descripción',
                condition: form.condition,
                price: priceValue,
                photo_url: form.photos.length > 0 ? form.photos[form.coverIndex] : null,
            };

            await updateListing(listing.id, listingData);
            Alert.alert('Actualizado', 'Los cambios se han guardado correctamente.');
            navigation.goBack();
        } catch (error: any) {
            setStatus(error?.message ?? 'No se pudo actualizar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Editar libro</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.photoContainer}>
                    <Text style={styles.label}>Fotos del libro</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                        <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                            <MaterialIcons name="add-a-photo" size={32} color={colors.text} />
                            <Text style={styles.addPhotoText}>Añadir más</Text>
                        </Pressable>
                        {form.photos.map((uri, idx) => (
                            <View key={idx} style={styles.photoThumb}>
                                <Image source={{ uri }} style={styles.thumbImage} />
                                <Pressable
                                    style={[styles.coverBadge, form.coverIndex === idx ? styles.coverBadgeActive : null]}
                                    onPress={() => updateField('coverIndex', idx)}
                                >
                                    <Text style={styles.coverBadgeText}>
                                        {form.coverIndex === idx ? 'Portada' : 'Elegir'}
                                    </Text>
                                </Pressable>
                                <Pressable style={styles.deletePhoto} onPress={() => removePhoto(idx)}>
                                    <MaterialIcons name="close" size={12} color="#FFF" />
                                </Pressable>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Título</Text>
                        <TextInput
                            style={styles.input}
                            value={form.title}
                            onChangeText={(v) => updateField('title', v)}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Autor</Text>
                        <TextInput
                            style={styles.input}
                            value={form.author}
                            onChangeText={(v) => updateField('author', v)}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estado</Text>
                        <View style={styles.conditionGrid}>
                            {CONDITIONS.map((c) => (
                                <Pressable
                                    key={c}
                                    style={[styles.conditionBtn, form.condition === c ? styles.conditionBtnActive : null]}
                                    onPress={() => updateField('condition', c)}
                                >
                                    <Text style={[styles.conditionText, form.condition === c ? styles.conditionTextActive : null]}>
                                        {c}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Precio</Text>
                        <View style={styles.priceInputRow}>
                            <Text style={styles.priceSymbol}>$</Text>
                            <TextInput
                                style={[styles.input, styles.priceInput]}
                                keyboardType="numeric"
                                value={form.price}
                                onChangeText={(v) => updateField('price', v)}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={4}
                            value={form.description}
                            onChangeText={(v) => updateField('description', v)}
                        />
                    </View>
                </View>
                {status.length > 0 && <Text style={styles.statusText}>{status}</Text>}
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.saveBtn, (!canSubmit || loading) ? styles.btnDisabled : null]}
                    onPress={handleSave}
                    disabled={!canSubmit || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.saveBtnText}>Guardar cambios</Text>
                            <MaterialIcons name="check" size={20} color="#FFF" />
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    container: {
        paddingBottom: 100,
    },
    photoContainer: {
        padding: spacing.lg,
    },
    photoRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    addPhotoBtn: {
        width: 100,
        aspectRatio: 1,
        borderRadius: radius.md,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPhotoText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.text,
        marginTop: 4,
    },
    photoThumb: {
        width: 100,
        aspectRatio: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    coverBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 2,
        alignItems: 'center',
    },
    coverBadgeActive: {
        backgroundColor: colors.primary,
    },
    coverBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    deletePhoto: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginLeft: 4,
    },
    input: {
        height: 50,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    priceInputRow: {
        position: 'relative',
    },
    priceSymbol: {
        position: 'absolute',
        left: 16,
        top: 14,
        fontSize: 16,
        fontWeight: '700',
        color: colors.muted,
        zIndex: 1,
    },
    priceInput: {
        paddingLeft: 30,
        fontWeight: '700',
    },
    textArea: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    conditionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    conditionBtn: {
        flex: 1,
        minWidth: '45%',
        height: 40,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    conditionBtnActive: {
        borderColor: colors.text,
        backgroundColor: colors.text,
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.muted,
    },
    conditionTextActive: {
        color: '#FFF',
    },
    statusText: {
        textAlign: 'center',
        color: colors.primary,
        marginTop: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: 30,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveBtn: {
        height: 52,
        backgroundColor: '#1E293B',
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    btnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        color: colors.muted,
        fontSize: 16,
        marginBottom: 20,
    },
    backBtn: {
        padding: 12,
        backgroundColor: colors.primary,
        borderRadius: radius.md,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
