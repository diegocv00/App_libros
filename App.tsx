import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';

// Importa Supabase y tu tema
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

// Importa todas tus pantallas
import { AuthScreen } from './src/screens/AuthScreen';
import { ResaleScreen } from './src/screens/ResaleScreen';
import { PublishScreen } from './src/screens/PublishScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen';
import { EditScreen } from './src/screens/EditScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { CommunityWallScreen } from './src/screens/CommunityWallScreen';
import { EditCommunityScreen } from './src/screens/EditCommunityScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { InboxScreen } from './src/screens/InboxScreen'; // ✅ Importada la nueva pantalla

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Pestañas principales de la barra inferior
function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabsNavigator"
      initialRouteName="Mercado"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Mercado"
        component={ResaleScreen as any}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-bag" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Publicar"
        component={PublishScreen as any}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Comunidades"
        component={CommunitiesScreen as any}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen as any}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id="MainStackNavigator">
        {session ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            />

            {/* Pantalla de Chat con header personalizado */}
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />

            {/* ✅ Nueva pantalla de Bandeja de Entrada añadida al Stack */}
            <Stack.Screen
              name="Inbox"
              component={InboxScreen}
              options={{
                headerTitle: 'Mis mensajes',
                headerTintColor: colors.primary,
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitle: '', // ✅ Esto elimina el texto junto a la flecha sin dar error
              }}
            />

            <Stack.Screen
              name="EditListing"
              component={EditScreen}
              options={{
                headerTitle: 'Editar publicación',
                headerTintColor: colors.primary,
              }}
            />

            <Stack.Screen
              name="CommunityWall"
              component={CommunityWallScreen}
              options={({ route }: any) => ({
                headerTitle: route.params?.community?.name || 'Comunidad',
                headerTintColor: colors.primary,
              })}
            />

            <Stack.Screen
              name="EditCommunity"
              component={EditCommunityScreen}
              options={{
                headerTitle: 'Editar Comunidad',
                headerTintColor: colors.primary,
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}