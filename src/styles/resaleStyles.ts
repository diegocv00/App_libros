import { StyleSheet, Dimensions } from 'react-native';
import { colors, radius, spacing } from '../theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export const resaleStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    header: { backgroundColor: '#fff', paddingBottom: spacing.sm },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    brand: { flexDirection: 'row', alignItems: 'center' },
    brandTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
    navIcons: { flexDirection: 'row', gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center',
    },
    badgeContainer: {
        position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444',
        borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff'
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f1f5f9',
        marginHorizontal: spacing.lg,
        paddingHorizontal: spacing.md,
        height: 48, borderRadius: radius.md,
        marginBottom: spacing.md,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text },
    chipScroll: { paddingLeft: spacing.lg, paddingRight: spacing.sm, gap: spacing.sm, paddingBottom: spacing.md },
    chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, backgroundColor: '#f1f5f9' },
    chipActive: { backgroundColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
    chipTextActive: { color: '#fff' },
    list: { paddingBottom: 100 },
    row: { paddingHorizontal: spacing.lg, justifyContent: 'space-between', marginBottom: spacing.lg },
    bookCard: { width: COLUMN_WIDTH },
    imageContainer: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: 8 },
    bookImage: { width: '100%', height: '100%' },
    favBtn: {
        position: 'absolute', top: 8, right: 8,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },
    favBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    bookInfo: { gap: 2 },
    bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    bookAuthor: { fontSize: 12, color: colors.muted },
    bookCategory: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 1 },
    bookPrice: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 2 },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 },
});
