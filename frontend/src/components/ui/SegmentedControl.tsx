import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export interface SegmentOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID?: string;
}

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
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[styles.option, selected && { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.text, { color: selected ? colors.surface : colors.textSecondary }]}>{opt.label}</Text>
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
