import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export interface SegmentOption {
  id: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID?: string;
}

// SegmentedControl: fixed set of views/periods where exactly one option is
// always selected (selectedId is non-nullable) — contrast with ChipGroup.
export function SegmentedControl({ options, selectedId, onSelect, testID }: SegmentedControlProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]} testID={testID}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[styles.option, selected && { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.text, { color: selected ? colors.background : colors.textSecondary }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", borderRadius: radii.pill, padding: 4, alignSelf: "flex-start" },
  option: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill },
  text: { fontSize: fontSizes.small, fontWeight: "700" },
});
