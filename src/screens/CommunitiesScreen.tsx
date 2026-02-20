import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { createCommunity, fetchCommunities, joinCommunity } from '../services/communities';
import { supabase } from '../lib/supabase';
import { Community } from '../types';
import { colors, radius, spacing } from '../theme';
import { communitiesStyles as styles } from '../styles/communitiesStyles';

const CATEGORIES = ['Todos', '#Clásicos', '#Sci-Fi', '#Misterio', '#Terror', '#Poesía', '#Biografías', '#Cómic', '#Infantil', '#Novela', '#Ensayo', '#Autoayuda', '#Viajes', '#Cocina'];

export function CommunitiesScreen() {
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const initialForm = { name: '', topic: CATEGORIES[1], description: '', photo: null as string | null };
  const [form, setForm] = useState(initialForm);

  const canCreate = useMemo(() => form.name.trim().length > 0 && form.topic.trim().length > 0, [form.name, form.topic]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Cargamos todas las comunidades
      const data = await fetchCommunities();
      setCommunities(data);

      // 2. Cargamos las suscripciones persistentes del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (memberData) {
          // Guardamos los IDs de las comunidades a las que ya pertenece para mostrar "Unido"
          setJoinedIds(memberData.map(row => row.community_id));
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCommunities();
    }, [loadCommunities])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setForm(prev => ({ ...prev, photo: result.assets[0].uri }));
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
        photo_url: form.photo
      });
      setCommunities((prev) => [created, ...prev]);
      setJoinedIds((prev) => [...prev, created.id]);
      setForm(initialForm);
      setIsModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo crear.');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (communityId: string) => {
    if (joiningId) return;
    setJoiningId(communityId);
    try {
      await joinCommunity(communityId);
      setJoinedIds((prev) => [...prev, communityId]);
      Alert.alert('¡Éxito!', 'Te has unido a la comunidad');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'No se pudo unir a la comunidad');
    } finally {
      setJoiningId(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}><MaterialIcons name="account-circle" size={32} color={colors.primary} /></View>
          <View><Text style={styles.headerTitle}>Comunidades</Text><Text style={styles.headerSubtitle}>Encuentra tu próximo club</Text></View>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Buscar géneros o clubes..." placeholderTextColor={colors.muted} value={searchText} onChangeText={setSearchText} />
        {searchText.length > 0 && <Pressable onPress={() => setSearchText('')}><MaterialIcons name="close" size={18} color={colors.muted} /></Pressable>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.categoryTag, selectedCategory === cat ? styles.categoryTagActive : null]}>
            <Text style={[styles.categoryText, selectedCategory === cat ? styles.categoryTextActive : null]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[styles.sectionTitle, { marginLeft: spacing.lg, marginBottom: spacing.sm }]}>Comunidades para ti</Text>
    </View>
  );

  const filteredCommunities = useMemo(() => {
    let result = communities;
    if (selectedCategory !== 'Todos') result = result.filter(v => v.topic === selectedCategory);
    if (searchText.trim().length > 0) result = result.filter(v => v.name.toLowerCase().includes(searchText.toLowerCase()) || v.topic.toLowerCase().includes(searchText.toLowerCase()));
    return result;
  }, [communities, selectedCategory, searchText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : <Text style={styles.emptyText}>No hay comunidades disponibles.</Text>}
        renderItem={({ item }) => {
          const isCreator = currentUserId === item.creator_id;
          const joined = joinedIds.includes(item.id) || isCreator;
          const isJoining = joiningId === item.id;

          return (
            <Pressable style={styles.card} onPress={() => navigation.navigate('CommunityWall', { community: item })}>
              <View style={styles.cardContent}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.noImageContainer]}>
                    <MaterialIcons name="groups" size={32} color={colors.primary} />
                  </View>
                )}

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
                      <View style={[styles.avatarStack, { backgroundColor: '#e2e8f0' }]} />
                      <View style={[styles.avatarStack, { backgroundColor: '#cbd5e1', marginLeft: -8 }]} />
                      <Text style={styles.othersCount}>+{item.member_count || 1}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        if (!joined) handleJoin(item.id);
                      }}
                      disabled={joined || isJoining}
                      style={[styles.joinButton, joined ? styles.joinedButton : null]}
                    >
                      {isJoining ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.joinButtonText, joined ? { color: colors.muted } : null]}>
                          {joined ? 'Unido' : 'Unirme'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => setIsModalVisible(true)}><MaterialIcons name="add" size={32} color="#FFF" /></Pressable>
      <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear comunidad</Text>
              <Pressable onPress={() => { setIsModalVisible(false); setForm(initialForm); }}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.photoSection}>
                <Pressable style={styles.photoUploadBtn} onPress={pickImage}>
                  {form.photo ? <Image source={{ uri: form.photo }} style={styles.uploadedPhoto} /> : <><MaterialIcons name="add-a-photo" size={32} color={colors.primary} /><Text style={styles.photoUploadText}>Elegir portada</Text></>}
                </Pressable>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la comunidad</Text>
                <TextInput style={styles.input} placeholder="Ej: Lectores de Fantasía" value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCategoryScroll}>
                  {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                    <Pressable key={cat} onPress={() => setForm(f => ({ ...f, topic: cat }))} style={[styles.modalCatTag, form.topic === cat ? styles.modalCatTagActive : null]}>
                      <Text style={[styles.modalCatText, form.topic === cat ? styles.modalCatTextActive : null]}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="¿De qué trata este club?" multiline value={form.description} onChangeText={(v) => setForm(f => ({ ...f, description: v }))} />
              </View>
              <Pressable style={[styles.submitBtn, !canCreate || saving ? styles.btnDisabled : null]} onPress={handleCreate} disabled={!canCreate || saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Crear ahora</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}