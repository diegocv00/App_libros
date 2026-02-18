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

export function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <MaterialIcons name="menu-book" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>App libros</Text>
                        <Text style={styles.subtitle}>
                            {isSignUp ? 'Crea tu cuenta literaria' : 'Bienvenido de nuevo, lector'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {isSignUp && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre completo</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Correo electrónico</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Pressable
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isSignUp ? 'Registrarse' : 'Iniciar sesión'}
                                </Text>
                            )}
                        </Pressable>

                        {/* NUEVO BOTÓN: Recuperar contraseña (solo en modo Iniciar Sesión) */}
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
                            style={styles.switchBtn}
                            onPress={() => setIsSignUp(!isSignUp)}
                        >
                            <Text style={styles.switchText}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    flex: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.muted,
        marginTop: 8,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginLeft: 4,
    },
    input: {
        height: 56,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        fontSize: 15,
        color: colors.text,
    },
    button: {
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    switchBtn: {
        alignItems: 'center',
        marginTop: 10,
    },
    switchText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});