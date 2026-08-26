import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export type BadgeVariant = "soft" | "dark" | "danger";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

// Variante "dark" é deliberadamente estática (não segue o tema) — é um
// acento visual sempre-escuro usado em destaques pontuais (ex: "Economize 50%"),
// independente de o app estar em light ou dark mode.
const DARK_BADGE_BG = "#0A0F0D";
const DARK_BADGE_TEXT = "#10B981";

export function Badge({ label, variant = "soft" }: BadgeProps) {
  const { colors } = useTheme();
  const { bg, text } =
    variant === "dark"
      ? { bg: DARK_BADGE_BG, text: DARK_BADGE_TEXT }
      : variant === "danger"
      ? { bg: colors.dangerSoft, text: colors.danger }
      : { bg: colors.primarySoft, text: colors.primary };

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: fontSizes.micro, fontWeight: "700" },
});
