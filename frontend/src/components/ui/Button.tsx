import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = "primary", disabled, loading, testID, style }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
      ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary }
      : { backgroundColor: "transparent" };

  const textColor = variant === "primary" ? colors.onPrimary : variant === "secondary" ? colors.primary : colors.textMuted;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      style={[
        styles.base,
        variantStyle,
        variant === "ghost" && styles.ghostPadding,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostPadding: { paddingVertical: 10 },
  disabled: { opacity: 0.6 },
  text: { fontSize: fontSizes.body, fontWeight: "800" },
});
