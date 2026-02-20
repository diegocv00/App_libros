import React, { useMemo, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
// ✅ Importamos uploadImage
import { createListing, saveDraft, uploadImage } from '../services/listings';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatInputPrice, cleanPrice } from '../utils/formatters';
import { publishStyles as styles } from '../styles/publishStyles';

const CONDITIONS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable'];
// ✅ Añadimos las categorías
const CATEGORIES = [
  'Todo', 'Ficción', 'Ciencia', 'Historia', 'Tecnología',
  'Arte', 'Novela', 'Académico', 'Infantil', 'Raro',
  'Cómic', 'Poesía', 'Cocina'
];

const initialForm = {
  title: '',
  author: '',
  description: '',
  condition: 'Nuevo',
  category: 'Todo',
  stock: '1',
  price: '',
  location: '',     // ✅ Nuevo campo de ubicación
  photos: [] as string[],
  coverIndex: 0,
};

export function PublishScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.draft) {
      const { draft } = route.params;
      setDraftId(draft.id);
      setForm({
        title: draft.title || '',
        author: draft.author || '',
        description: draft.description || '',
        condition: draft.condition || 'Nuevo',
        category: draft.category || 'Todo',
        stock: draft.stock ? String(draft.stock) : '1',
        price: draft.price ? String(draft.price) : '',
        location: draft.location || '', // ✅ Nuevo campo
        photos: Array.isArray(draft.photos) ? draft.photos : [],
        coverIndex: draft.cover_index || 0,
      });
      setDraftName(draft.draft_name || '');
      navigation.setParams({ draft: undefined });
    }
  }, [route.params?.draft]);

  const canSubmit = useMemo(() => {
    // ✅ Ahora también exigimos que haya stock
    return form.title.trim().length > 0 && form.price.trim().length > 0 && form.stock.trim().length > 0;
  }, [form.price, form.title, form.stock]);

  const updateField = (key: keyof typeof form, value: any) => {
    let finalValue = value;
    if (key === 'price') finalValue = formatInputPrice(value);
    if (key === 'stock') finalValue = value.replace(/[^0-9]/g, ''); // ✅ Solo permitir números
    setForm((prev) => ({ ...prev, [key]: finalValue }));
  };

  const pickImage = async () => {
    const limit = 5 - form.photos.length;
    if (limit <= 0) {
      Alert.alert('Límite alcanzado', 'Solo puedes añadir un máximo de 5 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setForm(prev => {
        const combined = [...prev.photos, ...selectedUris];
        return { ...prev, photos: combined.slice(0, 5) };
      });
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

  const handlePublish = async () => {
    setStatus('');
    if (!canSubmit) { setStatus('Completa al menos el título, precio y stock.'); return; }

    const rawPrice = cleanPrice(form.price);
    const priceValue = parseInt(rawPrice, 10);
    const stockValue = parseInt(form.stock, 10); // ✅ Validar stock

    if (isNaN(priceValue) || priceValue <= 0) { setStatus('El precio debe ser un número válido.'); return; }
    if (isNaN(stockValue) || stockValue < 0) { setStatus('El stock no es válido.'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let publicPhotoUrl: string | null = null;

      if (form.photos.length > 0) {
        setStatus('Subiendo imagen de portada...');
        const localUri = form.photos[form.coverIndex];
        publicPhotoUrl = await uploadImage(localUri);
      }

      setStatus('Publicando libro...');
      const newListing = await createListing({
        title: form.title.trim(),
        author: form.author.trim() || 'Autor no especificado',
        description: form.description.trim() || 'Sin descripción',
        condition: form.condition,
        price: priceValue,
        category: form.category, // ✅ Enviamos categoría
        stock: stockValue,       // ✅ Enviamos stock
        photo_url: publicPhotoUrl,
        seller_id: user.id,
        review: null,
        publisher: null,
        edition: null,
        year: null,
        location: form.location.trim() || null, // ✅ Enviamos ubicación
      });

      if (draftId) {
        await supabase.from('drafts').delete().eq('id', draftId);
      }

      setForm(initialForm);

      navigation.navigate('MainTabs', { screen: 'Mercado' });
      navigation.navigate('ListingDetail', { listing: newListing });

    } catch (error: any) {
      setStatus(error?.message ?? 'No se pudo publicar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) return;
    setLoading(true);
    try {
      await saveDraft({
        id: draftId || undefined,
        draft_name: draftName.trim(),
        title: form.title,
        author: form.author,
        description: form.description,
        condition: form.condition,
        category: form.category,
        stock: parseInt(form.stock) || 1,
        price: form.price,
        location: form.location, // ✅ Guardar ubicación en borrador
        photos: form.photos,
        cover_index: form.coverIndex,
      } as any);
      setShowDraftModal(false);
      setDraftName('');
      setStatus('Borrador guardado.');
    } catch (err: any) {
      setStatus('Error al guardar borrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={colors.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>Publicar libro</Text>
        <Pressable
          onPress={() => { setDraftName(form.title || ''); setShowDraftModal(true); }}
          disabled={loading || !form.title}
        >
          <Text style={[styles.draftText, (!form.title || loading) ? { opacity: 0.4 } : null]}>Borrador</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.photoContainer}>
          <Text style={styles.label}>Fotos del libro ({form.photos.length}/5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {form.photos.length < 5 ? (
              <Pressable
                style={({ pressed }) => [styles.addPhotoBtn, pressed && { opacity: 0.7 }]}
                onPress={pickImage}
              >
                <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
                <Text style={styles.addPhotoText}>Añadir fotos</Text>
              </Pressable>
            ) : null}

            {form.photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <Pressable
                  style={[styles.coverBadge, form.coverIndex === idx ? styles.coverBadgeActive : null]}
                  onPress={() => updateField('coverIndex', idx)}
                >
                  <Text style={styles.coverBadgeText}>
                    {form.coverIndex === idx ? '★ Portada' : 'Usar portada'}
                  </Text>
                </Pressable>
                <Pressable style={styles.deletePhoto} onPress={() => removePhoto(idx)}>
                  <MaterialIcons name="close" size={12} color="#FFF" />
                </Pressable>
              </View>
            ))}

            {form.photos.length === 0 ? (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="image" size={24} color={colors.muted} />
                <Text style={styles.photoPlaceholderText}>Sin fotos</Text>
              </View>
            ) : null}
          </ScrollView>
          <Text style={styles.hint}>Toca una foto para seleccionarla como portada.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título del libro</Text>
            <TextInput style={styles.input} placeholder="Ej: Rayuela" placeholderTextColor="#94a3b8"
              value={form.title} onChangeText={(v) => updateField('title', v)} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Autor</Text>
            <TextInput style={styles.input} placeholder="Ej: Julio Cortázar" placeholderTextColor="#94a3b8"
              value={form.author} onChangeText={(v) => updateField('author', v)} />
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
            <Text style={styles.label}>Estado del libro</Text>
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

          {/* ✅ PRECIO Y STOCK EN LA MISMA FILA */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>Precio de venta</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.priceSymbol}>$</Text>
                <TextInput style={[styles.input, styles.priceInput]} placeholder="0" placeholderTextColor="#94a3b8"
                  keyboardType="numeric" value={form.price} onChangeText={(v) => updateField('price', v)} />
              </View>
              <Text style={styles.hint}>Comisión del 5%.</Text>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Stock disp.</Text>
              <TextInput style={styles.input} placeholder="1" placeholderTextColor="#94a3b8"
                keyboardType="numeric" value={form.stock} onChangeText={(v) => updateField('stock', v)} />
              <Text style={styles.hint}>Cantidad total</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Cuéntanos más sobre el libro..."
              placeholderTextColor="#94a3b8" multiline numberOfLines={4}
              value={form.description} onChangeText={(v) => updateField('description', v)} />
          </View>
        </View>

        {status ? <Text style={styles.statusText}>{status}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.publishBtn, (!canSubmit || loading) ? styles.btnDisabled : null]}
          onPress={handlePublish}
          disabled={!canSubmit || loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.publishBtnText}>Publicar libro</Text>
              <MaterialIcons name="rocket-launch" size={20} color="#FFF" />
            </>
          )}
        </Pressable>
      </View>

      <Modal visible={showDraftModal} transparent animationType="fade" onRequestClose={() => setShowDraftModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDraftModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconBg}>
                <MaterialIcons name="bookmark" size={28} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Guardar borrador</Text>
            <Text style={styles.modalSubtitle}>Ponle un nombre para encontrarlo fácilmente.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Libro de física pendiente"
              placeholderTextColor={colors.muted}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowDraftModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, !draftName.trim() ? { opacity: 0.5 } : null]}
                onPress={handleSaveDraft}
                disabled={!draftName.trim() || loading}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Guardar</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
