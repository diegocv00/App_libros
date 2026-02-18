import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchListings } from '../services/listings';
import { Listing } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

const CATEGORIES = ['Todo', 'Ficción', 'Ciencia', 'Historia', 'Tecnología', 'Arte', 'Novela', 'Académico', 'Infantil', 'Raro', 'Cómic', 'Poesía', 'Cocina'];

export function ResaleScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todo');

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.author.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'Todo' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [listings, searchText, selectedCategory]);

  const loadListings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await fetchListings();
      setListings(data);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar la reventa.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings(false);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.topNav}>
        <View style={styles.brand}>
          <MaterialIcons name="menu-book" size={28} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.brandTitle}>Mercado</Text>
        </View>
        <View style={styles.navIcons}>
          <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones pendientes.')}>
            <MaterialIcons name="notifications-none" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Carrito', 'Tu carrito está vacío.')}>
            <MaterialIcons name="shopping-cart" size={20} color={colors.text} />
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
            <Text style={styles.emptyText}>No hay libros publicados en esta categoría.</Text>
          ) : loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop' }}
                style={styles.bookImage}
              />
              <Pressable style={styles.favBtn}>
                <MaterialIcons name="favorite-border" size={16} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
              <Text style={styles.bookPrice}>{formatCurrency(item.price)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: spacing.sm,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  navIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  chipScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  bookCard: {
    width: COLUMN_WIDTH,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    gap: 2,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  bookAuthor: {
    fontSize: 12,
    color: colors.muted,
  },
  bookPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
    fontSize: 14,
  },
});
