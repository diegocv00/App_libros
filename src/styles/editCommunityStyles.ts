import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const editCommunityStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    form: { padding: spacing.lg, gap: spacing.lg },
    photoSection: { alignItems: 'center', marginBottom: spacing.md },
    photoUploadBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + '10', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    uploadedPhoto: { width: '100%', height: '100%' },
    photoUploadText: { fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 4 },
    inputGroup: { gap: 8 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 4 },
    input: { height: 56, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, fontSize: 15 },
    textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
    submitBtn: { height: 56, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    btnDisabled: { backgroundColor: '#cbd5e1' },
    categoryScroll: { gap: 8, paddingVertical: 4 },
    catTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: colors.border },
    catTagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { fontSize: 13, fontWeight: '600', color: colors.muted },
    catTextActive: { color: '#fff' },

    // NUEVO: ESTILO PARA EL BOTÓN ELIMINAR FOTO
    deletePhotoBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ef4444',
        padding: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    }
});