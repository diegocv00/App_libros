import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';
import { authStyles } from '../styles/authStyles';

export function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    // ✅ NUEVO: Estado para ver/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor, rellena todos los campos.');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name || email.split('@')[0],
                        },
                    },
                });
                if (error) throw error;
                Alert.alert('¡Éxito!', 'Revisa tu correo para confirmar la cuenta.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            Alert.alert('Error de autenticación', error.message);
        } finally {
            setLoading(false);
        }
    }

    // NUEVA FUNCIÓN: Recuperar contraseña
    async function handleResetPassword() {
        if (!email) {
            Alert.alert('Error', 'Introduce tu correo electrónico arriba para recuperar la contraseña.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Éxito', 'Revisa tu correo electrónico para cambiar la contraseña.');
        }
    }

    return (
        <SafeAreaView style={authStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={authStyles.flex}
            >
                <View style={authStyles.content}>
                    <View style={authStyles.header}>
                        <View style={authStyles.logoContainer}>
                            <MaterialIcons name="menu-book" size={48} color={colors.primary} />
                        </View>
                        <Text style={authStyles.title}>App libros</Text>
                        <Text style={authStyles.subtitle}>
                            {isSignUp ? 'Crea tu cuenta literaria' : 'Bienvenido de nuevo, lector'}
                        </Text>
                    </View>

                    <View style={authStyles.form}>
                        {isSignUp && (
                            <View style={authStyles.inputGroup}>
                                <Text style={authStyles.label}>Nombre completo</Text>
                                <TextInput
                                    style={authStyles.input}
                                    placeholder="Tu nombre"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={authStyles.inputGroup}>
                            <Text style={authStyles.label}>Correo electrónico</Text>
                            <TextInput
                                style={authStyles.input}
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={authStyles.inputGroup}>
                            <Text style={authStyles.label}>Contraseña</Text>
                            {/* ✅ NUEVO: View contenedor para el input y el ojito */}
                            <View>
                                <TextInput
                                    style={[authStyles.input, { paddingRight: 50 }]} // padding para no pisar el ícono
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword} // Muestra u oculta según el estado
                                />
                                {/* ✅ NUEVO: Botón del ojito */}
                                <Pressable
                                    style={authStyles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <MaterialIcons
                                        name={showPassword ? 'visibility' : 'visibility-off'}
                                        size={24}
                                        color={colors.muted}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        <Pressable
                            style={[authStyles.button, loading && authStyles.buttonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={authStyles.buttonText}>
                                    {isSignUp ? 'Registrarse' : 'Iniciar sesión'}
                                </Text>
                            )}
                        </Pressable>

                        {/* BOTÓN: Recuperar contraseña (solo en modo Iniciar Sesión) */}
                        {!isSignUp && (
                            <Pressable
                                style={{ alignItems: 'center', marginTop: -5 }}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={authStyles.switchBtn}
                            onPress={() => setIsSignUp(!isSignUp)}
                        >
                            <Text style={authStyles.switchText}>
                                {isSignUp
                                    ? '¿Ya tienes cuenta? Inicia sesión'
                                    : '¿No tienes cuenta? Regístrate'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

