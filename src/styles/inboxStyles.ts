import { StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';

export const inboxStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: spacing.md,
        paddingBottom: 40 // Espacio extra al final para scroll cómodo
    },
    convCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    bookImage: {
        width: 50,
        height: 65,
        borderRadius: radius.sm,
        marginRight: spacing.md,
        backgroundColor: '#e2e8f0'
    },
    info: {
        flex: 1,
        justifyContent: 'center'
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text
    },
    bookTitle: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 4
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginRight: 8,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    emptyText: {
        marginTop: 16,
        color: colors.muted,
        fontSize: 16,
        textAlign: 'center'
    }
});
