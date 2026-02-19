import React, { useCallback, useState, useMemo } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchListings, fetchFavorites, toggleFavorite, fetchFavoriteIds } from '../services/listings';
import { Listing } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

const CATEGORIES = ['Todo', 'Ficción', 'Ciencia', 'Historia', 'Tecnología', 'Arte', 'Novela', 'Académico', 'Infantil', 'Raro', 'Cómic', 'Poesía', 'Cocina'];

export function ResaleScreen() {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  // Filtrado de libros basado en búsqueda y categoría
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.author.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'Todo' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [listings, searchText, selectedCategory]);

  // Carga de libros y favoritos
  const loadListings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [data, favIds] = await Promise.all([
        fetchListings(),
        fetchFavoriteIds(),
      ]);
      setListings(data);
      setFavoriteIds(new Set(favIds));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar el mercado.');
    } finally {
      setLoading(false); // ✅ Se apaga siempre para evitar pantalla infinita de carga
    }
  }, []);

  // ✅ Recarga automática cuando la pantalla gana el foco (vuelves de otra pestaña)
  useFocusEffect(
    useCallback(() => {
      loadListings(false);
    }, [loadListings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings(false);
    setRefreshing(false);
  };

  const handleToggleFavorite = async (item: Listing) => {
    const isFav = favoriteIds.has(item.id);
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    try {
      await toggleFavorite(item.id, isFav);
    } catch {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
    }
  };

  const openFavorites = async () => {
    setShowFavorites(true);
    setFavLoading(true);
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } catch {
      setFavorites([]);
    } finally {
      setFavLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.topNav}>
        <View style={styles.brand}>
          <MaterialIcons name="menu-book" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.brandTitle}>Mercado</Text>
        </View>
        <View style={styles.navIcons}>
          <Pressable style={styles.iconBtn} onPress={openFavorites}>
            <MaterialIcons name="favorite" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <MaterialIcons name="notifications-none" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Busca títulos, autores o ISBN..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')}>
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.chip, selectedCategory === cat ? styles.chipActive : null]}
          >
            <Text style={[styles.chipText, selectedCategory === cat ? styles.chipTextActive : null]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && filteredListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No hay libros en esta categoría.</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : null
        }
        renderItem={({ item }) => {
          const isFav = favoriteIds.has(item.id);
          return (
            <Pressable
              style={styles.bookCard}
              // ✅ Navegación a la pantalla de detalles
              onPress={() => navigation.navigate('ListingDetail', { listing: item })}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop' }}
                  style={styles.bookImage}
                />
                <Pressable
                  style={[styles.favBtn, isFav && styles.favBtnActive]}
                  onPress={(e) => {
                    e.stopPropagation(); // ✅ Evita que el clic en el corazón abra el detalle
                    handleToggleFavorite(item);
                  }}
                >
                  <MaterialIcons
                    name={isFav ? 'favorite' : 'favorite-border'}
                    size={16}
                    color={isFav ? '#ef4444' : '#fff'}
                  />
                </Pressable>
                {item.condition ? (
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{item.condition}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                <Text style={styles.bookPrice}>{formatCurrency(item.price)}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={showFavorites}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFavorites(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="favorite" size={22} color="#ef4444" />
              <Text style={styles.modalTitle}>Mis Favoritos</Text>
            </View>
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowFavorites(false)}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {favLoading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="favorite-border" size={64} color={colors.muted} />
              <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
              <Text style={styles.emptySubtitle}>Toca el corazón en cualquier libro para guardarlo aquí.</Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={[styles.list, { paddingTop: spacing.md }]}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.bookCard}
                  onPress={() => {
                    setShowFavorites(false);
                    navigation.navigate('ListingDetail', { listing: item });
                  }}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop' }}
                      style={styles.bookImage}
                    />
                    <Pressable
                      style={[styles.favBtn, styles.favBtnActive]}
                      onPress={async (e) => {
                        e.stopPropagation();
                        await toggleFavorite(item.id, true);
                        setFavorites(prev => prev.filter(f => f.id !== item.id));
                        setFavoriteIds(prev => {
                          const next = new Set(prev);
                          next.delete(item.id);
                          return next;
                        });
                      }}
                    >
                      <MaterialIcons name="favorite" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                    <Text style={styles.bookPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: '#fff', paddingBottom: spacing.sm },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  navIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48, borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text },
  chipScroll: { paddingLeft: spacing.lg, paddingRight: spacing.sm, gap: spacing.sm, paddingBottom: spacing.md },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 100 },
  row: { paddingHorizontal: spacing.lg, justifyContent: 'space-between', marginBottom: spacing.lg },
  bookCard: { width: COLUMN_WIDTH },
  imageContainer: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: 8 },
  bookImage: { width: '100%', height: '100%' },
  favBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  favBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  conditionBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  bookInfo: { gap: 2 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookAuthor: { fontSize: 12, color: colors.muted },
  bookPrice: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
});