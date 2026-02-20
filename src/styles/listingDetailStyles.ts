import { StyleSheet, Dimensions } from 'react-native';
import { colors, radius, spacing } from '../theme';

const { width } = Dimensions.get('window');

export const listingDetailStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerActions: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    circleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    image: {
        width: width,
        height: width * 1.2,
        backgroundColor: '#f1f5f9',
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    mainInfo: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 32,
    },
    author: {
        fontSize: 18,
        color: colors.muted,
        marginTop: 4,
        fontWeight: '500',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    price: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.primary,
    },
    conditionBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.md,
    },
    conditionText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: colors.text,
        opacity: 0.8,
    },
    specsContainer: {
        marginTop: spacing.lg,
        gap: 12,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    specText: {
        fontSize: 14,
        color: colors.text, // Mejor contraste para la información
        fontWeight: '500',
    },
    sellerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sellerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sellerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    sellerRating: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: 34,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    buyBtn: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
