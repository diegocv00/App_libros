import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { updateCommunity } from '../services/communities';
import { colors, radius, spacing } from '../theme';

const CATEGORIES = ['#Clásicos', '#Sci-Fi', '#Misterio', '#Terror', '#Poesía', '#Biografías', '#Cómic', '#Infantil', '#Novela', '#Ensayo', '#Autoayuda', '#Viajes', '#Cocina'];

export function EditCommunityScreen({ route, navigation }: any) {
    const { community } = route.params;
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: community.name,
        topic: community.topic,
        description: community.description,
        photo: community.photo_url as string | null,
    });

    const canSave = form.name.trim().length > 0 && form.topic.trim().length > 0;

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) setForm(prev => ({ ...prev, photo: result.assets[0].uri }));
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            await updateCommunity(community.id, {
                name: form.name.trim(),
                topic: form.topic.trim(),
                description: form.description.trim(),
                photo_url: form.photo,
            });
            Alert.alert('Éxito', 'Comunidad actualizada');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'No se pudo actualizar la comunidad');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.photoSection}>
                    <Pressable style={styles.photoUploadBtn} onPress={pickImage}>
                        {form.photo ? <Image source={{ uri: form.photo }} style={styles.uploadedPhoto} /> : <><MaterialIcons name="add-a-photo" size={32} color={colors.primary} /><Text style={styles.photoUploadText}>Cambiar foto</Text></>}
                    </Pressable>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre de la comunidad</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Categoría</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                        {CATEGORIES.map(cat => (
                            <Pressable key={cat} onPress={() => setForm(f => ({ ...f, topic: cat }))} style={[styles.catTag, form.topic === cat ? styles.catTagActive : null]}>
                                <Text style={[styles.catText, form.topic === cat ? styles.catTextActive : null]}>{cat}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Descripción</Text>
                    <TextInput style={[styles.input, styles.textArea]} multiline value={form.description} onChangeText={(v) => setForm(f => ({ ...f, description: v }))} />
                </View>

                <Pressable style={[styles.submitBtn, !canSave || saving ? styles.btnDisabled : null]} onPress={handleSave} disabled={!canSave || saving}>
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Guardar cambios</Text>}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    form: { padding: spacing.lg, gap: spacing.lg },
    photoSection: { alignItems: 'center', marginBottom: spacing.md },
    photoUploadBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + '10', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    uploadedPhoto: { width: '100%', height: '100%' },
    photoUploadText: { fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 4 },
    inputGroup: { gap: 8 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 4 },
    input: { height: 56, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, fontSize: 15 },
    textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
    submitBtn: { height: 56, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    btnDisabled: { backgroundColor: '#cbd5e1' },
    categoryScroll: { gap: 8, paddingVertical: 4 },
    catTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: colors.border },
    catTagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { fontSize: 13, fontWeight: '600', color: colors.muted },
    catTextActive: { color: '#fff' }
});