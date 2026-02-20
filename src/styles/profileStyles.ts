import { StyleSheet, Dimensions } from 'react-native';
import { colors, radius, spacing } from '../theme';

const { width } = Dimensions.get('window');

export const profileStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    logoutBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    hero: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    avatarContainer: { position: 'relative', marginBottom: spacing.md },
    avatarBlur: { position: 'absolute', inset: -4, borderRadius: 99, backgroundColor: colors.primary, opacity: 0.2 },
    avatarFrame: {
        width: 112, height: 112, borderRadius: 56,
        borderWidth: 4, borderColor: colors.primary, padding: 4, backgroundColor: colors.bg,
    },
    avatar: { width: '100%', height: '100%', borderRadius: 50 },
    avatarPlaceholder: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    deleteAvatarBtn: {
        position: 'absolute', bottom: -4, right: -4,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#ef4444', borderWidth: 3, borderColor: colors.bg,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    profileName: { fontSize: 24, fontWeight: '800', color: colors.text },
    profileBio: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    editBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
        paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.md, marginTop: spacing.lg,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
    },
    editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    statCard: {
        flex: 1, backgroundColor: '#FFF', borderRadius: radius.lg, padding: spacing.md,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, gap: 4,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
    statLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textAlign: 'center' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
    tab: { flex: 1, paddingBottom: 12, alignItems: 'center', justifyContent: 'center' },
    tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
    tabText: { fontSize: 12, fontWeight: '700', color: colors.muted },
    tabTextActive: { color: colors.primary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40 },
    gridItem: { width: (width - spacing.lg * 2 - spacing.md) / 2, gap: 8 },
    bookThumbContainer: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#e2e8f0', position: 'relative' },
    bookThumb: { width: '100%', height: '100%' },
    actionIconBtn: {
        position: 'absolute', top: 8,
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
    },
    bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    bookPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
    emptyContainer: { alignItems: 'center', paddingVertical: 40, width: '100%' },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 14 },
    draftCard: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
        borderWidth: 1, borderColor: colors.border, gap: spacing.md, marginBottom: 12,
    },
    draftIconBg: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    },
    draftInfo: { flex: 1 },
    draftName: { fontSize: 14, fontWeight: '800', color: colors.text },
    draftTitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
    draftDate: { fontSize: 10, color: colors.muted, marginTop: 4 },
    draftEditBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    },
    editForm: { width: '100%', gap: 12, marginTop: 10 },
    editInput: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text,
    },
    editTextArea: { height: 80, textAlignVertical: 'top' },
    saveBtn: {
        backgroundColor: colors.primary, height: 48, borderRadius: radius.md,
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
    },
    modalCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl, width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
    },
    modalIconRow: { alignItems: 'center', marginBottom: spacing.md },
    modalIconBg: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
    modalSubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
    modalConfirmBtn: {
        flex: 1, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
