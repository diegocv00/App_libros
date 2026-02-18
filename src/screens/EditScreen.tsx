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
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatInputPrice, cleanPrice } from '../utils/formatters';

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
        price: listing ? formatInputPrice(String(listing.price)) : '',
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
        return form.title.trim().length > 0 && form.price.trim().length > 0;
    }, [form.price, form.title]);

    const updateField = (key: keyof typeof form, value: any) => {
        let finalValue = value;
        if (key === 'price') finalValue = formatInputPrice(value);
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
        if (!canSubmit) { setStatus('Completa al menos el título y el precio.'); return; }

        const rawPrice = cleanPrice(form.price);
        const priceValue = parseInt(rawPrice, 10);
        if (isNaN(priceValue) || priceValue <= 0) { setStatus('El precio debe ser un número válido.'); return; }

        setLoading(true);
        try {
            await updateListing(listing.id, {
                title: form.title.trim(),
                author: form.author.trim() || 'Autor no especificado',
                description: form.description.trim() || 'Sin descripción',
                condition: form.condition,
                price: priceValue,
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
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Precio</Text>
                        <View style={styles.priceInputRow}>
                            <Text style={styles.priceSymbol}>$</Text>
                            <TextInput style={[styles.input, styles.priceInput]}
                                keyboardType="numeric" value={form.price}
                                onChangeText={(v) => updateField('price', v)} />
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

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backIconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    container: { paddingBottom: 100 },
    photoContainer: { padding: spacing.lg },
    photoRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 8 },
    addPhotoBtn: {
        width: 100, aspectRatio: 1, borderRadius: radius.md,
        backgroundColor: colors.primary + '08',
        borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary + '40',
        alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    addPhotoText: { fontSize: 10, fontWeight: '700', color: colors.primary },
    photoThumb: { width: 100, aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden' },
    thumbImage: { width: '100%', height: '100%' },
    coverBadge: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, alignItems: 'center',
    },
    coverBadgeActive: { backgroundColor: colors.primary },
    coverBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
    deletePhoto: {
        position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    form: { paddingHorizontal: spacing.lg, gap: spacing.lg },
    inputGroup: { gap: 6 },
    label: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 4 },
    input: {
        height: 50, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: 16, fontSize: 15, color: colors.text,
    },
    priceInputRow: { position: 'relative' },
    priceSymbol: { position: 'absolute', left: 16, top: 14, fontSize: 16, fontWeight: '700', color: colors.muted, zIndex: 1 },
    priceInput: { paddingLeft: 30, fontWeight: '700' },
    textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
    conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    conditionBtn: {
        flex: 1, minWidth: '45%', height: 40, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF',
        alignItems: 'center', justifyContent: 'center',
    },
    conditionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08', borderWidth: 2 },
    conditionText: { fontSize: 12, fontWeight: '600', color: colors.muted },
    conditionTextActive: { color: colors.primary, fontWeight: '700' },
    statusText: { textAlign: 'center', color: '#ef4444', marginTop: 20, paddingHorizontal: spacing.lg },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: spacing.lg, paddingBottom: 30,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: colors.border,
    },
    saveBtn: {
        height: 52, backgroundColor: colors.primary, borderRadius: radius.md,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    btnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
    errorText: { color: colors.muted, fontSize: 16, textAlign: 'center' },
    backBtn: { padding: 12, backgroundColor: colors.primary, borderRadius: radius.md },
    backBtnText: { color: '#FFF', fontWeight: '700' },
});
