import React, { useEffect, useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { fetchMyListings, fetchDrafts, fetchSellerRating, deleteListing } from '../services/listings';
import { Listing, Draft } from '../types';

const TABS = ['Publicados', 'Vendidos', 'Borradores'];

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <MaterialIcons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-border'}
          size={14}
          color="#f59e0b"
        />
      ))}
      {count > 0 ? (
        <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 2 }}>({count})</Text>
      ) : null}
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState({ name: '', bio: '', avatar: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();

      if (profileData) {
        setProfile({
          name: profileData.name || user.email?.split('@')[0] || 'Usuario',
          bio: profileData.bio || '',
          avatar: profileData.avatar_url || '',
        });
      }

      const [listings, draftList, ratingData] = await Promise.all([
        fetchMyListings(),
        fetchDrafts(),
        fetchSellerRating(user.id),
      ]);

      setMyListings(listings);
      setDrafts(draftList);
      setRating(ratingData);
    } catch (err) {
      console.error('Error cargando datos del perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDeleteListing = (id: string) => {
    Alert.alert(
      'Eliminar publicación',
      '¿Estás seguro de que quieres borrar este libro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteListing(id);
              loadData();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar la publicación.');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      await supabase.from('profiles').update({
        name: profile.name, bio: profile.bio, avatar_url: profile.avatar,
      }).eq('id', user.id);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setProfile(p => ({ ...p, avatar: result.assets[0].uri }));
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil literario</Text>
          <Pressable style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
            <MaterialIcons name="logout" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {/* Profile Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBlur} />
            <Pressable style={styles.avatarFrame} onPress={() => isEditing && pickAvatar()}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={50} color={colors.muted} />
                </View>
              )}
              {(profile.avatar && isEditing) ? (
                <Pressable style={styles.deleteAvatarBtn} onPress={() => setProfile(p => ({ ...p, avatar: '' }))}>
                  <MaterialIcons name="delete" size={16} color="#FFF" />
                </Pressable>
              ) : null}
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput style={styles.editInput} value={profile.name}
                onChangeText={(v) => setProfile(p => ({ ...p, name: v }))} placeholder="Nombre" />
              <TextInput style={[styles.editInput, styles.editTextArea]} value={profile.bio}
                onChangeText={(v) => setProfile(p => ({ ...p, bio: v }))} multiline placeholder="Bio" />
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.bio ? <Text style={styles.profileBio}>{profile.bio}</Text> : null}
              <Pressable style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <MaterialIcons name="edit" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.editBtnText}>Editar perfil</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Libros publicados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rating.avg > 0 ? rating.avg.toFixed(1) : '—'}</Text>
            <StarRow rating={rating.avg} count={rating.count} />
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{drafts.length}</Text>
            <Text style={styles.statLabel}>Borradores</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.grid}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20, width: '100%' }} color={colors.primary} />
          ) : activeTab === 'Borradores' ? (
            drafts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="bookmark-border" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No tienes borradores guardados.</Text>
              </View>
            ) : (
              drafts.map((draft) => (
                <Pressable
                  key={draft.id}
                  style={styles.draftCard}
                  onPress={() => (navigation as any).navigate('Publicar', { draft })} // Tarea 1: Redirigir a Publicar
                >
                  <View style={styles.draftIconBg}>
                    <MaterialIcons name="bookmark" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.draftInfo}>
                    <Text style={styles.draftName} numberOfLines={1}>{draft.draft_name || 'Sin nombre'}</Text>
                    <Text style={styles.draftTitle} numberOfLines={1}>{draft.title || 'Sin título'}</Text>
                    <Text style={styles.draftDate}>
                      {new Date(draft.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.draftEditBtn}>
                    <MaterialIcons name="edit" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))
            )
          ) : activeTab === 'Vendidos' ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="sell" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>Aún no has vendido ningún libro.</Text>
            </View>
          ) : (
            myListings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="menu-book" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No has publicado libros aún.</Text>
              </View>
            ) : (
              myListings.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => (navigation as any).navigate('ListingDetail', { listing: item })} // Tarea 1: Redirigir a Detalle
                >
                  <View style={styles.bookThumbContainer}>
                    <Image
                      source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop' }}
                      style={styles.bookThumb}
                    />

                    {/* Botón de Editar a la derecha */}
                    <Pressable
                      style={[styles.actionIconBtn, { right: 8, backgroundColor: 'rgba(0,0,0,0.5)' }]}
                      onPress={() => (navigation as any).navigate('EditListing', { listing: item })}
                    >
                      <MaterialIcons name="edit" size={14} color="#FFF" />
                    </Pressable>

                    {/* Botón de Eliminar a la izquierda */}
                    <Pressable
                      style={[styles.actionIconBtn, { left: 8, backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}
                      onPress={() => handleDeleteListing(item.id)}
                    >
                      <MaterialIcons name="delete" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                  <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bookPrice}>{formatCurrency(item.price)}</Text>
                </Pressable>
              ))
            )
          )}
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconBg, { backgroundColor: '#fef2f2' }]}>
                <MaterialIcons name="logout" size={28} color="#ef4444" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalSubtitle}>¿Estás seguro de que quieres salir de tu cuenta?</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirmBtn, { backgroundColor: '#ef4444' }]} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Salir</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  avatarContainer: { position: 'relative', marginBottom: spacing.md },
  avatarBlur: { position: 'absolute', inset: -4, borderRadius: 99, backgroundColor: colors.primary, opacity: 0.2 },
  avatarFrame: {
    width: 112, height: 112, borderRadius: 56,
    borderWidth: 4, borderColor: colors.primary, padding: 4, backgroundColor: colors.bg,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  deleteAvatarBtn: {
    position: 'absolute', bottom: -4, right: -4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#ef4444', borderWidth: 3, borderColor: colors.bg,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  profileName: { fontSize: 24, fontWeight: '800', color: colors.text },
  profileBio: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.md, marginTop: spacing.lg,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
  tab: { flex: 1, paddingBottom: 12, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  gridItem: { width: (width - spacing.lg * 2 - spacing.md) / 2, gap: 8 },
  bookThumbContainer: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#e2e8f0', position: 'relative' },
  bookThumb: { width: '100%', height: '100%' },
  actionIconBtn: {
    position: 'absolute', top: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, width: '100%' },
  emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 },
  draftCard: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, marginBottom: 12,
  },
  draftIconBg: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  draftInfo: { flex: 1 },
  draftName: { fontSize: 14, fontWeight: '800', color: colors.text },
  draftTitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  draftDate: { fontSize: 10, color: colors.muted, marginTop: 4 },
  draftEditBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  editForm: { width: '100%', gap: 12, marginTop: 10 },
  editInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text,
  },
  editTextArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary, height: 48, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
  },
  modalIconRow: { alignItems: 'center', marginBottom: spacing.md },
  modalIconBg: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  modalConfirmBtn: {
    flex: 1, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});