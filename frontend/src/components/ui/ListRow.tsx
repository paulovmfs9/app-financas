import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing, fontSizes } from "../../utils/theme";

export interface ListRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  iconBg?: string;
  testID?: string;
}

export function ListRow({ icon, title, subtitle, value, valueColor, iconBg, testID }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg ?? colors.primarySoft }]}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.value, { color: valueColor ?? colors.textPrimary }]}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1 },
  title: { fontSize: fontSizes.small, fontWeight: "700" },
  subtitle: { fontSize: fontSizes.micro, marginTop: 2 },
  value: { fontSize: fontSizes.small, fontWeight: "700" },
});
