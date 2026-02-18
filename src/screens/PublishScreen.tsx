import React, { useMemo, useState } from 'react';
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
import { createListing } from '../services/listings';
import { saveDraft } from '../services/listings';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { formatInputPrice, cleanPrice } from '../utils/formatters';

const CONDITIONS = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable'];

const initialForm = {
  title: '',
  author: '',
  description: '',
  condition: 'Nuevo',
  price: '',
  photos: [] as string[],
  coverIndex: 0,
};

export function PublishScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftName, setDraftName] = useState('');

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
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir fotos.');
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
      // ✅ Punto 8: sin Alert al añadir imágenes
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
    if (!canSubmit) { setStatus('Completa al menos el título y el precio.'); return; }

    const rawPrice = cleanPrice(form.price);
    const priceValue = parseInt(rawPrice, 10);
    if (isNaN(priceValue) || priceValue <= 0) { setStatus('El precio debe ser un número válido.'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      await createListing({
        title: form.title.trim(),
        author: form.author.trim() || 'Autor no especificado',
        description: form.description.trim() || 'Sin descripción',
        condition: form.condition,
        price: priceValue,
        photo_url: form.photos.length > 0 ? form.photos[form.coverIndex] : null,
        seller_id: user.id,
        category: null, review: null, publisher: null, edition: null, year: null, location: null,
      });
      setForm(initialForm);
      navigation.goBack();
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
        draft_name: draftName.trim(),
        title: form.title,
        author: form.author,
        description: form.description,
        condition: form.condition,
        price: form.price,
        photos: form.photos,
        cover_index: form.coverIndex,
      });
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={colors.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>Publicar libro</Text>
        <Pressable
          onPress={() => { setDraftName(form.title || ''); setShowDraftModal(true); }}
          disabled={loading || !form.title}
        >
          <Text style={[styles.draftText, (!form.title || loading) && { opacity: 0.4 }]}>Borrador</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Upload */}
        <View style={styles.photoContainer}>
          <Text style={styles.label}>Fotos del libro</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            <Pressable
              style={({ pressed }) => [styles.addPhotoBtn, pressed && { opacity: 0.7 }]}
              onPress={pickImage}
            >
              <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
              <Text style={styles.addPhotoText}>Añadir fotos</Text>
            </Pressable>

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

            {form.photos.length === 0 && (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="image" size={24} color={colors.muted} />
                <Text style={styles.photoPlaceholderText}>Sin fotos</Text>
              </View>
            )}
          </ScrollView>
          <Text style={styles.hint}>Toca una foto para seleccionarla como portada.</Text>
        </View>

        {/* Form */}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio de venta</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput style={[styles.input, styles.priceInput]} placeholder="0" placeholderTextColor="#94a3b8"
                keyboardType="numeric" value={form.price} onChangeText={(v) => updateField('price', v)} />
            </View>
            <Text style={styles.hint}>Se aplicará una comisión del 5% al venderse.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Cuéntanos más sobre el libro..."
              placeholderTextColor="#94a3b8" multiline numberOfLines={4}
              value={form.description} onChangeText={(v) => updateField('description', v)} />
          </View>
        </View>

        {status.length > 0 && <Text style={styles.statusText}>{status}</Text>}
      </ScrollView>

      {/* Footer */}
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

      {/* Draft Name Modal */}
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
                style={[styles.modalConfirmBtn, !draftName.trim() && { opacity: 0.5 }]}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff',
  },
  headerIcon: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  draftText: { fontSize: 14, fontWeight: '700', color: colors.primary, width: 60, textAlign: 'right' },
  container: { paddingBottom: 120 },
  photoContainer: { padding: spacing.lg },
  photoRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 12 },
  addPhotoBtn: {
    width: 140, aspectRatio: 1, borderRadius: radius.lg,
    backgroundColor: colors.primary + '08',
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary + '40',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  photoThumb: { width: 140, aspectRatio: 1, borderRadius: radius.lg, position: 'relative', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  deletePhoto: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholder: {
    width: 140, aspectRatio: 1, borderRadius: radius.lg,
    backgroundColor: '#fff', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoPlaceholderText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  coverBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, alignItems: 'center',
  },
  coverBadgeActive: { backgroundColor: colors.primary },
  coverBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  form: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 4 },
  input: {
    height: 56, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.text,
  },
  priceInputRow: { position: 'relative' },
  priceSymbol: { position: 'absolute', left: 16, top: 15, fontSize: 18, fontWeight: '700', color: colors.muted, zIndex: 1 },
  priceInput: { paddingLeft: 32, fontWeight: '700', fontSize: 18 },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionBtn: {
    flex: 1, minWidth: '45%', height: 48, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  conditionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08', borderWidth: 2 },
  conditionText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  conditionTextActive: { color: colors.primary, fontWeight: '700' },
  hint: { fontSize: 11, color: colors.muted, marginLeft: 4 },
  statusText: { padding: spacing.lg, textAlign: 'center', color: colors.primary, fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, paddingBottom: 40,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  publishBtn: {
    height: 56, backgroundColor: colors.primary, borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
  // Draft Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl,
    width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
  },
  modalIconRow: { alignItems: 'center', marginBottom: spacing.md },
  modalIconBg: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  modalInput: {
    height: 52, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.text, marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  modalConfirmBtn: {
    flex: 1, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
