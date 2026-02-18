import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
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
import { createCommunity, fetchCommunities } from '../services/communities';
import { Community } from '../types';
import { colors, radius, spacing } from '../theme';

const CATEGORIES = ['Todos', '#Clásicos', '#Sci-Fi', '#Misterio', '#Terror', '#Poesía', '#Biografías', '#Cómic', '#Infantil', '#Novela', '#Ensayo', '#Autoayuda', '#Viajes', '#Cocina'];



export function CommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [form, setForm] = useState({
    name: '',
    topic: CATEGORIES[1],
    description: '',
  });

  const canCreate = useMemo(() => {
    return form.name.trim().length > 0 && form.topic.trim().length > 0;
  }, [form.name, form.topic]);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCommunities();
      setCommunities(data);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar las comunidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const toggleJoin = (id: string) => {
    setJoinedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    try {
      const created = await createCommunity({
        name: form.name.trim(),
        topic: form.topic.trim(),
        description: form.description.trim() || 'Sin descripción',
        rules: '',
        location: '',
      });
      setCommunities((prev) => [created, ...prev]);
      setForm({ name: '', topic: '', description: '' });
      setIsModalVisible(false);
      Alert.alert('Éxito', 'Comunidad creada correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo crear la comunidad.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="account-circle" size={32} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Comunidades</Text>
            <Text style={styles.headerSubtitle}>Encuentra tu próximo club</Text>
          </View>
        </View>
        <Pressable style={styles.headerIcon} onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones de comunidades.')}>
          <MaterialIcons name="notifications-none" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar géneros o clubes..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.categoryTag, selectedCategory === cat ? styles.categoryTagActive : null]}
          >
            <Text style={[styles.categoryText, selectedCategory === cat ? styles.categoryTextActive : null]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Trending Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tendencias hoy</Text>
          <Pressable><Text style={styles.seeAll}>Ver todo</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
          {communities.slice(0, 3).map((club) => (
            <ImageBackground
              key={club.id}
              source={{ uri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400&auto=format&fit=crop' }}
              style={styles.trendingCard}
              imageStyle={{ borderRadius: radius.md }}
            >
              <View style={styles.trendingOverlay}>
                <View style={styles.trendingBadge}>
                  <Text style={styles.trendingBadgeText}>Nuevo</Text>
                </View>
                <Text style={styles.trendingName}>{club.name}</Text>
                <View style={styles.trendingMeta}>
                  <MaterialIcons name="group" size={14} color="#CBD5E1" />
                  <Text style={styles.trendingMetaText}>{club.member_count} miembros</Text>
                </View>
              </View>
            </ImageBackground>
          ))}
          {communities.length === 0 && !loading && (
            <Text style={[styles.emptyText, { marginLeft: spacing.lg }]}>No hay tendencias hoy.</Text>
          )}
        </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.sm }]}>
        Comunidades para ti
      </Text>
    </View>
  );

  const filteredCommunities = useMemo(() => {
    let result = communities;
    if (selectedCategory !== 'Todos') {
      result = result.filter(v => v.topic === selectedCategory);
    }
    if (searchText.trim().length > 0) {
      result = result.filter(v =>
        v.name.toLowerCase().includes(searchText.toLowerCase()) ||
        v.topic.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return result;
  }, [communities, selectedCategory, searchText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <Text style={styles.emptyText}>No hay comunidades disponibles.</Text>
          )
        }
        renderItem={({ item }) => {
          const joined = joinedIds.includes(item.id);
          return (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop' }}
                  style={styles.cardImage}
                />
                <View style={styles.cardInfo}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardSub}>{item.topic}</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Activo</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.memberAvatars}>
                      {/* Simulate avatar stack */}
                      <View style={[styles.avatarStack, { backgroundColor: '#e2e8f0' }]} />
                      <View style={[styles.avatarStack, { backgroundColor: '#cbd5e1', marginLeft: -8 }]} />
                      <Text style={styles.othersCount}>+12</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleJoin(item.id)}
                      style={[styles.joinButton, joined ? styles.joinedButton : null]}
                    >
                      <Text style={[styles.joinButtonText, joined ? styles.joinButtonText : null]}>
                        {joined ? 'Unido' : 'Unirme'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <MaterialIcons name="add" size={32} color="#FFF" />
      </Pressable>

      {/* Creation Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear comunidad</Text>
              <Pressable onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la comunidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Lectores de Fantasía"
                  value={form.name}
                  onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCategoryScroll}>
                  {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                    <Pressable
                      key={cat}
                      onPress={() => setForm(f => ({ ...f, topic: cat }))}
                      style={[styles.modalCatTag, form.topic === cat ? styles.modalCatTagActive : null]}
                    >
                      <Text style={[styles.modalCatText, form.topic === cat ? styles.modalCatTextActive : null]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="¿De qué trata este club?"
                  multiline
                  value={form.description}
                  onChangeText={(v) => setForm(f => ({ ...f, description: v }))}
                />
              </View>

              <Pressable
                style={[styles.submitBtn, !canCreate || saving ? styles.btnDisabled : null]}
                onPress={handleCreate}
                disabled={!canCreate || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Crear ahora</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20', // Opacity 20%
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  categoryScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  categoryTextActive: {
    color: '#fff',
  },
  section: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'none',
  },
  trendingScroll: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  trendingCard: {
    width: 280,
    height: 160,
    justifyContent: 'flex-end',
  },
  trendingOverlay: {
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  trendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'none',
  },
  trendingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendingMetaText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  othersCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinedButton: {
    backgroundColor: '#f1f5f9',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  modalForm: {
    gap: spacing.xl,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  modalCategoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  modalCatTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCatTagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalCatText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  modalCatTextActive: {
    color: '#fff',
  },
});
