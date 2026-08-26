import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing } from "../../utils/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = spacing.base }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
});
