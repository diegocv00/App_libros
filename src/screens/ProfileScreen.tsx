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
import { profileStyles as styles } from '../styles/profileStyles';

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
          name: profileData.full_name || profileData.name || user.email?.split('@')[0] || 'Usuario',
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

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permisos", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // CORRECCIÓN: Ahora se usa un arreglo con el texto 'images'
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfile(p => ({ ...p, avatar: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    setIsEditing(false);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      let avatarUrlToSave = profile.avatar;

      // 1. Validar si la imagen es una foto recién seleccionada (ruta local)
      if (profile.avatar && profile.avatar.startsWith('file://')) {
        const fileExt = profile.avatar.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const contentType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

        // Usar fetch y arrayBuffer para evitar errores de red en Android
        const response = await fetch(profile.avatar);
        const arrayBuffer = await response.arrayBuffer();

        // Subir al bucket 'avatars' de Supabase
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            contentType: contentType,
            upsert: true
          });

        if (uploadError) throw new Error('No se pudo subir la foto de perfil: ' + uploadError.message);

        // Obtener la URL pública generada
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrlToSave = publicUrlData.publicUrl;
      }

      // 2. Actualizar la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name.trim(),
          bio: profile.bio,
          avatar_url: avatarUrlToSave,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setProfile(p => ({ ...p, avatar: avatarUrlToSave }));
      loadData();

    } catch (err: any) {
      console.error('Error al guardar:', err);
      Alert.alert('Error', 'No se pudo guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil literario</Text>
          <Pressable style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
            <MaterialIcons name="logout" size={20} color={colors.muted} />
          </Pressable>
        </View>

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
                onChangeText={(v) => setProfile(p => ({ ...p, name: v }))} placeholder="Nombre completo" />
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

        {/* Stats - Con navegación interna */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statCard} onPress={() => setActiveTab('Publicados')}>
            <Text style={styles.statValue}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Libros publicados</Text>
          </Pressable>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rating.avg > 0 ? rating.avg.toFixed(1) : '—'}</Text>
            <StarRow rating={rating.avg} count={rating.count} />
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
          <Pressable style={styles.statCard} onPress={() => setActiveTab('Borradores')}>
            <Text style={styles.statValue}>{drafts.length}</Text>
            <Text style={styles.statLabel}>Borradores</Text>
          </Pressable>
        </View>

        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

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
                  onPress={() => (navigation as any).navigate('Publicar', { draft })}
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
                  onPress={() => (navigation as any).navigate('ListingDetail', { listing: item })}
                >
                  <View style={styles.bookThumbContainer}>
                    <Image
                      source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop' }}
                      style={styles.bookThumb}
                    />
                    <Pressable
                      style={[styles.actionIconBtn, { right: 8, backgroundColor: 'rgba(0,0,0,0.5)' }]}
                      onPress={() => (navigation as any).navigate('EditListing', { listing: item })}
                    >
                      <MaterialIcons name="edit" size={14} color="#FFF" />
                    </Pressable>
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