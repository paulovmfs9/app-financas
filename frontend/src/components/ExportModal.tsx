import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radii, fontSizes } from "../utils/theme";
import type { ExportFormat } from "../services/exportService";

interface ExportModalProps {
  visible: boolean;
  loadingFormat: ExportFormat | null;
  colors: any;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

const OPTIONS: { format: ExportFormat; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; comingSoon?: boolean }[] = [
  { format: "pdf", title: "Exportar como PDF", subtitle: "Relatório para imprimir ou salvar", icon: "document-text-outline" },
  { format: "png", title: "Exportar como imagem PNG", subtitle: "Imagem do gráfico com legenda", icon: "image-outline" },
  { format: "csv", title: "Exportar como CSV", subtitle: "Tabela simples para planilhas", icon: "grid-outline" },
  { format: "xlsx", title: "Exportar como Excel/Sheets", subtitle: "Em breve", icon: "reader-outline", comingSoon: true },
  { format: "docx", title: "Exportar como Word", subtitle: "Em breve", icon: "document-outline", comingSoon: true },
];

export function ExportModal({ visible, loadingFormat, colors, onClose, onExport }: ExportModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity accessibilityRole="button" activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Exportar resumo</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Escolha o formato do arquivo</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.closeButton} testID="export-modal-close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {OPTIONS.map((option) => {
            const loading = loadingFormat === option.format;
            return (
              <TouchableOpacity
                key={option.format}
                accessibilityRole="button"
                activeOpacity={0.78}
                disabled={loadingFormat !== null}
                onPress={() => onExport(option.format)}
                style={[styles.option, { borderColor: colors.border, backgroundColor: colors.background }]}
                testID={`export-option-${option.format}`}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}> 
                  <Ionicons name={option.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: option.comingSoon ? colors.warning : colors.textMuted }]}>{option.subtitle}</Text>
                </View>
                {loading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  title: { fontSize: fontSizes.h3, fontWeight: "800" },
  subtitle: { fontSize: fontSizes.small, marginTop: 3 },
  closeButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderRadius: radii.lg, padding: spacing.base, marginBottom: spacing.sm },
  optionIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: fontSizes.body, fontWeight: "700" },
  optionSubtitle: { fontSize: fontSizes.micro, marginTop: 2 },
});
