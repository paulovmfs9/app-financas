import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing } from "../../utils/theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = spacing.base }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
