import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export function Toggle({ value, onValueChange, accessibilityLabel, testID }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      testID={testID}
      style={[styles.track, { backgroundColor: value ? colors.primary : colors.border }]}
    >
      <View style={[styles.knob, { backgroundColor: colors.onPrimary }, value ? styles.knobOn : styles.knobOff]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 20, padding: 2, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: 10 },
  knobOn: { alignSelf: "flex-end" },
  knobOff: { alignSelf: "flex-start" },
});
