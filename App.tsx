import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';

// Pantallas
import { PublishScreen } from './src/screens/PublishScreen';
import { ResaleScreen } from './src/screens/ResaleScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { EditScreen } from './src/screens/EditScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen'; // <-- 1. NUEVA IMPORTACIÓN

// Iconos y tema
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Mercado"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 70,
          paddingBottom: 15,
          paddingTop: 10,
        },
      }}
    >
      <Tab.Screen
        name="Mercado"
        component={ResaleScreen}
        options={{
          headerTitle: 'Mercado',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Publicar"
        component={PublishScreen}
        options={{
          headerTitle: 'Publicar libro',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Comunidades"
        component={CommunitiesScreen}
        options={{
          headerTitle: 'Comunidades',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          headerTitle: 'Perfil',
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="EditListing" component={EditScreen} />
        {/* 2. NUEVA RUTA REGISTRADA AQUÍ ABAJO 👇 */}
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}