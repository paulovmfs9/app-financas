import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing, fontSizes } from "../../utils/theme";

export interface ChipOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ChipGroupProps {
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  testID?: string;
}

// ChipGroup: selectable set where nothing may be selected (e.g. optional
// category filter — selectedId is nullable) — contrast with SegmentedControl.
export function ChipGroup({ options, selectedId, onSelect, testID }: ChipGroupProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        const tint = opt.color;
        const bg = selected ? (tint ? tint + "22" : colors.primary) : colors.surfaceAlt;
        const fg = selected ? (tint ?? colors.onPrimary) : colors.textSecondary;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[
              styles.chip,
              { backgroundColor: bg },
              selected && tint ? { borderColor: tint } : null,
            ]}
          >
            {opt.icon}
            <Text style={[styles.text, { color: fg }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: "transparent" },
  text: { fontSize: fontSizes.small, fontWeight: "700" },
});
