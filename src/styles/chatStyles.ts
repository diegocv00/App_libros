import { StyleSheet, Platform } from 'react-native';

// Colores extraídos de la plantilla HTML proporcionada
const htmlColors = {
    primary: '#1D61FF',
    backgroundLight: '#FFFFFF',
    bubbleIncoming: '#F1F5F9', // bg-slate-100
    textDark: '#0F172A',       // slate-900
    textMuted: '#64748b',      // slate-500
    textBubble: '#1e293b',     // slate-800
    border: '#f1f5f9'          // slate-100
};

export const chatStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: htmlColors.backgroundLight,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: htmlColors.backgroundLight,
    },

    // HEADER
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 0 : 12,
        paddingBottom: 12,
        backgroundColor: htmlColors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: htmlColors.border,
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
        borderRadius: 20,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        color: htmlColors.textDark,
    },
    headerBook: {
        fontSize: 12,
        color: htmlColors.textMuted,
        marginTop: 2,
    },

    // LISTA DE MENSAJES
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 24,
        flexGrow: 1,
        backgroundColor: htmlColors.backgroundLight,
    },


    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        marginBottom: 4, // <-- Cambia esto de 16 a 4
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: htmlColors.primary,
        borderBottomRightRadius: 0,
    },
    theirBubble: {
        alignSelf: 'flex-start',
        backgroundColor: htmlColors.bubbleIncoming,
        borderBottomLeftRadius: 0,
    },
    msgText: {
        fontSize: 15,
        color: htmlColors.textBubble,
    },

    // ÁREA DE INPUT (Footer)
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: htmlColors.backgroundLight,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: htmlColors.border,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    input: {
        flex: 1,
        backgroundColor: htmlColors.bubbleIncoming,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        maxHeight: 120,
        fontSize: 14,
        color: htmlColors.textDark,
        borderWidth: 0,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: htmlColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: htmlColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },

    // FOTO DE PERFIL Y BOTÓN DERECHO
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: htmlColors.bubbleIncoming,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    headerRightBtn: {
        padding: 8,
        borderRadius: 20,
    },

    // MODAL DE REPORTE
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: htmlColors.backgroundLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: htmlColors.textDark,
        marginBottom: 16,
    },
    reportInput: {
        backgroundColor: htmlColors.bubbleIncoming,
        borderRadius: 16,
        padding: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        color: htmlColors.textDark,
        marginBottom: 16,
        fontSize: 15,
    },
    reportBtn: {
        backgroundColor: '#ef4444',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    reportBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: htmlColors.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    messageWrapper: {
        marginBottom: 16,
        width: '100%',
    },
    timeText: {
        fontSize: 10,
        color: '#94a3b8',
        marginHorizontal: 4,
    },
    myTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    theirTimeText: {
        alignSelf: 'flex-start',
    },
});