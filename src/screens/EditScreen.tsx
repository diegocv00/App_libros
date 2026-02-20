import React, { useMemo, useState } from 'react';
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
import { colors, radius, spacing } from '../theme';
import { editScreenStyles as styles } from '../styles/editScreenStyles';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatInputPrice, cleanPrice } from '../utils/formatters';

const CONDITIONS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable'];
// ✅ Añadimos las categorías
const CATEGORIES = [
    'Todo', 'Ficción', 'Ciencia', 'Historia', 'Tecnología',
    'Arte', 'Novela', 'Académico', 'Infantil', 'Raro',
    'Cómic', 'Poesía', 'Cocina'
];

export function EditScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const listing = (route.params as any)?.listing;

    const [form, setForm] = useState({
        title: listing?.title || '',
        author: listing?.author || '',
        description: listing?.description || '',
        condition: listing?.condition || 'Nuevo',
        category: listing?.category || 'Todo',
        stock: listing?.stock ? String(listing.stock) : '1',
        price: listing ? formatInputPrice(String(listing.price)) : '',
        location: listing?.location || '', // ✅ Nuevo
        photos: listing?.photo_url ? [listing.photo_url] : [],
        coverIndex: 0,
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    if (!listing) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color={colors.muted} />
                    <Text style={styles.errorText}>No se encontró el libro para editar.</Text>
                    <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Volver</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const canSubmit = useMemo(() => {
        return form.title.trim().length > 0 && form.price.trim().length > 0 && form.stock.trim().length > 0;
    }, [form.price, form.title, form.stock]);

    const updateField = (key: keyof typeof form, value: any) => {
        let finalValue = value;
        if (key === 'price') finalValue = formatInputPrice(value);
        if (key === 'stock') finalValue = value.replace(/[^0-9]/g, ''); // ✅ Solo números para stock
        setForm((prev) => ({ ...prev, [key]: finalValue }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Equivalente a MediaTypeOptions.Images sin importar todo
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            const selectedUris = result.assets.map(asset => asset.uri);
            setForm(prev => ({ ...prev, photos: [...prev.photos, ...selectedUris] }));
            // Sin alerta al añadir imágenes
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
        if (!canSubmit) { setStatus('Completa al menos el título, precio y stock.'); return; }

        const rawPrice = cleanPrice(form.price);
        const priceValue = parseInt(rawPrice, 10);
        const stockValue = parseInt(form.stock, 10); // ✅ Validamos stock

        if (isNaN(priceValue) || priceValue <= 0) { setStatus('El precio debe ser un número válido.'); return; }
        if (isNaN(stockValue) || stockValue < 0) { setStatus('El stock no es válido.'); return; }

        setLoading(true);
        try {
            await updateListing(listing.id, {
                title: form.title.trim(),
                author: form.author.trim() || 'Autor no especificado',
                description: form.description.trim() || 'Sin descripción',
                condition: form.condition,
                category: form.category,
                stock: stockValue,
                price: priceValue,
                location: form.location.trim() || null, // ✅ Actualizar ubicación
                photo_url: form.photos.length > 0 ? form.photos[form.coverIndex] : null,
            });
            Alert.alert('✅ Actualizado', 'Los cambios se han guardado correctamente.');
            navigation.goBack();
        } catch (error: any) {
            const msg = error?.message ?? 'No se pudo actualizar.';
            setStatus(msg);
            Alert.alert('Error al guardar', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable style={styles.backIconBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Editar libro</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Photos */}
                <View style={styles.photoContainer}>
                    <Text style={styles.label}>Fotos del libro</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                        <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                            <MaterialIcons name="add-a-photo" size={28} color={colors.primary} />
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
                                        {form.coverIndex === idx ? '★ Portada' : 'Elegir'}
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
                        <TextInput style={styles.input} value={form.title}
                            onChangeText={(v) => updateField('title', v)} />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Autor</Text>
                        <TextInput style={styles.input} value={form.author}
                            onChangeText={(v) => updateField('author', v)} />
                    </View>

                    {/* ✅ CATEGORÍAS */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Categoría</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                            {CATEGORIES.map((c) => (
                                <Pressable key={c}
                                    style={[styles.conditionBtn, { paddingHorizontal: 16, minWidth: 'auto' }, form.category === c ? styles.conditionBtnActive : null]}
                                    onPress={() => updateField('category', c)}
                                >
                                    <Text style={[styles.conditionText, form.category === c ? styles.conditionTextActive : null]}>{c}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estado</Text>
                        <View style={styles.conditionGrid}>
                            {CONDITIONS.map((c) => (
                                <Pressable key={c}
                                    style={[styles.conditionBtn, form.condition === c ? styles.conditionBtnActive : null]}
                                    onPress={() => updateField('condition', c)}
                                >
                                    <Text style={[styles.conditionText, form.condition === c ? styles.conditionTextActive : null]}>{c}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* ✅ UBICACIÓN */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ubicación</Text>
                        <TextInput style={styles.input} placeholder="Ej: Ciudad, Barrio (Opcional)" placeholderTextColor="#94a3b8"
                            value={form.location} onChangeText={(v) => updateField('location', v)} />
                    </View>

                    {/* ✅ PRECIO Y STOCK */}
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <View style={[styles.inputGroup, { flex: 1.2 }]}>
                            <Text style={styles.label}>Precio</Text>
                            <View style={styles.priceInputRow}>
                                <Text style={styles.priceSymbol}>$</Text>
                                <TextInput style={[styles.input, styles.priceInput]}
                                    keyboardType="numeric" value={form.price}
                                    onChangeText={(v) => updateField('price', v)} />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Stock disp.</Text>
                            <TextInput style={styles.input}
                                keyboardType="numeric" value={form.stock}
                                onChangeText={(v) => updateField('stock', v)} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4}
                            value={form.description} onChangeText={(v) => updateField('description', v)} />
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
                    {loading ? <ActivityIndicator color="#FFF" /> : (
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

