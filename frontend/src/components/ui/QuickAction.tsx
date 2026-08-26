import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { fontSizes } from "../../utils/theme";

export interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
}

export function QuickAction({ icon, label, onPress, testID }: QuickActionProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={onPress} testID={testID} style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>{icon}</View>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", flex: 1, gap: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { fontSize: fontSizes.micro, fontWeight: "600" },
});
