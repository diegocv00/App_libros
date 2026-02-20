import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { updateCommunity } from '../services/communities';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';
import { editCommunityStyles as styles } from '../styles/editCommunityStyles';

const CATEGORIES = ['#Clásicos', '#Sci-Fi', '#Misterio', '#Terror', '#Poesía', '#Biografías', '#Cómic', '#Infantil', '#Novela', '#Ensayo', '#Autoayuda', '#Viajes', '#Cocina'];

export function EditCommunityScreen({ route, navigation }: any) {
    const { community } = route.params;

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: community.name,
        topic: community.topic,
        description: community.description,
        photo: community.photo_url as string | null,
    });

    const canSave = form.name.trim().length > 0 && form.topic.trim().length > 0;
    const isCreator = currentUserId === community.creator_id;

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) setForm(prev => ({ ...prev, photo: result.assets[0].uri }));
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            let photoUrlToSave = form.photo;

            // Arreglo para que las nuevas fotos seleccionadas se suban correctamente a Supabase
            if (form.photo && form.photo.startsWith('file://')) {
                const fileExt = form.photo.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `community_${community.id}_${Date.now()}.${fileExt}`;
                const response = await fetch(form.photo);
                const arrayBuffer = await response.arrayBuffer();

                const { error: uploadError } = await supabase.storage
                    .from('community_posts')
                    .upload(fileName, arrayBuffer, {
                        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
                        upsert: true
                    });

                if (uploadError) throw new Error('No se pudo subir la foto: ' + uploadError.message);

                const { data: publicUrlData } = supabase.storage
                    .from('community_posts')
                    .getPublicUrl(fileName);

                photoUrlToSave = publicUrlData.publicUrl;
            }

            await updateCommunity(community.id, {
                name: form.name.trim(),
                topic: form.topic.trim(),
                description: form.description.trim(),
                photo_url: photoUrlToSave,
            });

            Alert.alert('Éxito', 'Comunidad actualizada correctamente');
            navigation.goBack();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'No se pudo actualizar la comunidad');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.form}>

                <View style={styles.photoSection}>
                    <View style={{ position: 'relative' }}>
                        <Pressable style={styles.photoUploadBtn} onPress={pickImage}>
                            {form.photo ? (
                                <Image source={{ uri: form.photo }} style={styles.uploadedPhoto} />
                            ) : (
                                <>
                                    <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
                                    <Text style={styles.photoUploadText}>Cambiar foto</Text>
                                </>
                            )}
                        </Pressable>

                        {/* BOTÓN PARA ELIMINAR LA FOTO (Solo visible para el Creador de la comunidad) */}
                        {form.photo && isCreator && (
                            <Pressable
                                style={styles.deletePhotoBtn}
                                onPress={() => setForm(f => ({ ...f, photo: null }))}
                            >
                                <MaterialIcons name="delete" size={16} color="#FFF" />
                            </Pressable>
                        )}
                    </View>
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