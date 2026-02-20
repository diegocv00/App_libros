import { StyleSheet, Platform } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const chatStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    inputArea: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    },
    input: {
        flex: 1,
        backgroundColor: '#e2e8f0', // Increased contrast (darker gray background)
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        maxHeight: 120,
        fontSize: 16, // Increased text size
        color: colors.text,
        borderWidth: 1,
        borderColor: '#cbd5e1', // Explicit border for better contrast
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
        justifyContent: 'flex-end', // Empuja los mensajes hacia abajo si hay pocos
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerBook: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    bubble: { padding: 12, borderRadius: radius.lg, marginBottom: 8, maxWidth: '80%' },
    myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
    theirBubble: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
    msgText: { fontSize: 16, color: colors.text },
});
