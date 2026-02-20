import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const communityWallStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    headerAction: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: colors.primary + '11'
    },
    inner: { flex: 1 },
    listContent: { padding: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
    postCard: {
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm
    },
    authorName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    postDate: { fontSize: 11, color: colors.muted },
    postContent: { fontSize: 15, color: colors.text, lineHeight: 20 },
    emptyText: { textAlign: 'center', color: colors.muted, marginTop: 40 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '70%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.muted,
        marginBottom: 15,
        textTransform: 'uppercase'
    },
    searchBar: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: radius.md,
        marginBottom: 15
    },
    adminCandidateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    adminCandidateText: { fontSize: 16, color: colors.text, fontWeight: '500' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtn: { backgroundColor: colors.primary + '20' },
    removeBtn: { backgroundColor: '#fee2e2' },
    actionBtnText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
    closeModalBtn: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: 20
    }
});
