import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing } from "../../utils/theme";

export interface ScreenFooterProps {
  children: React.ReactNode;
}

// Handles the bottom safe-area inset itself — consumers should NOT also apply
// a bottom safe-area edge on their own SafeAreaView when using this component.
export function ScreenFooter({ children }: ScreenFooterProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.primary,
          borderTopColor: colors.primary,
          paddingBottom: spacing.base + insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
});
