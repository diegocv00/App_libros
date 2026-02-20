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
    },
    // ... (tus estilos anteriores)

    // BANNER DE LA COMUNIDAD
    bannerContainer: {
        width: '100%',
        height: 120,
        backgroundColor: colors.primary,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: spacing.md,
    },
    bannerTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    bannerTopic: {
        color: '#e2e8f0',
        fontSize: 14,
    },

    // IMÁGENES EN MENSAJES Y PREVISUALIZACIÓN
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        backgroundColor: '#f1f5f9',
    },
    imagePreviewContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    imagePreviewWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: radius.md,
    },
    removePreviewBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        padding: 2,
    },
    attachBtn: {
        marginRight: 10,
        padding: 4,
    },
    // VISOR DE IMÁGENES PANTALLA COMPLETA
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenCloseBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    fullScreenImg: {
        width: '100%',
        height: '80%',
    }
});
