import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing } from "../../utils/theme";

interface ScreenFooterProps {
  children: React.ReactNode;
}

export function ScreenFooter({ children }: ScreenFooterProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.base,
    gap: spacing.sm,
  },
});
