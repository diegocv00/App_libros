import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const authStyles = StyleSheet.create({
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
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        height: 24,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
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
