import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { fetchMyListings, fetchSavedListings } from '../services/listings';
import { Listing } from '../types';

const TABS = ['Publicados', 'Vendidos', 'Guardados'];

export function ProfileScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            name: profileData.name || user.email?.split('@')[0] || 'Usuario',
            bio: profileData.bio || '',
            avatar: profileData.avatar_url || '',
          });
        }

        // Load Listings
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('seller_id', user.id);

        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
        } else if (listings) {
          console.log(`Fetched ${listings.length} listings for user ${user.id}`);
          setMyListings(listings);
        }

        // Saved listings (mock or actual if service exists)
        const saved = await fetchSavedListings();
        setSavedListings(saved);

      } catch (err) {
        console.error('Error cargando datos del perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      await supabase
        .from('profiles')
        .update({
          name: profile.name,
          bio: profile.bio,
          avatar_url: profile.avatar,
        })
        .eq('id', user.id);

      Alert.alert('Perfil actualizado', 'Tus cambios se han guardado en la nube.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar tu foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfile(p => ({ ...p, avatar: result.assets[0].uri }));
      Alert.alert('Foto actualizada', 'Recuerda guardar los cambios para que sean permanentes.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil literario</Text>
        </View>

        {/* Profile Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBlur} />
            <Pressable
              style={styles.avatarFrame}
              onPress={() => isEditing && pickAvatar()}
            >
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={50} color={colors.muted} />
                </View>
              )}
              {profile.avatar && isEditing && (
                <Pressable
                  style={styles.deleteAvatarBtn}
                  onPress={() => setProfile(p => ({ ...p, avatar: '' }))}
                >
                  <MaterialIcons name="delete" size={16} color="#FFF" />
                </Pressable>
              )}
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={profile.name}
                onChangeText={(v) => setProfile(p => ({ ...p, name: v }))}
                placeholder="Nombre"
              />
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={profile.bio}
                onChangeText={(v) => setProfile(p => ({ ...p, bio: v }))}
                multiline
                placeholder="Bio"
              />
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileBio}>{profile.bio}</Text>
              <Pressable style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <MaterialIcons name="edit" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.editBtnText}>Editar perfil</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{myListings.length}</Text>
            </View>
            <Text style={styles.statLabel}>Libros publicados</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>98%</Text>
              <MaterialIcons name="stars" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Listings Grid */}
        <View style={styles.grid}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20, width: '100%' }} color={colors.primary} />
          ) : (
            (activeTab === 'Publicados' ? myListings : activeTab === 'Guardados' ? savedListings : []).map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <View style={styles.bookThumbContainer}>
                  <Image
                    source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop' }}
                    style={styles.bookThumb}
                  />
                  <Pressable
                    style={styles.itemEditBtn}
                    onPress={() => (navigation as any).navigate('EditListing', { listing: item })}
                  >
                    <MaterialIcons name="edit" size={14} color="#FFF" />
                  </Pressable>
                </View>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookPrice}>{formatCurrency(item.price)}</Text>
              </View>
            ))
          )}
          {!loading && (activeTab === 'Publicados' ? myListings : activeTab === 'Guardados' ? savedListings : []).length === 0 && (
            <Text style={styles.emptyText}>No hay libros en esta sección.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarBlur: {
    position: 'absolute',
    inset: -4,
    borderRadius: 99,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  avatarFrame: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.primary,
    padding: 4,
    backgroundColor: colors.bg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  profileBio: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  deleteAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  itemEditBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: 40,
  },
  gridItem: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    gap: 8,
  },
  bookThumbContainer: {
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  bookThumb: {
    width: '100%',
    height: '100%',
  },
  bookBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  bookPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  editForm: {
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 20,
    fontSize: 14,
    width: '100%',
  },
});
