import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}

export function Toggle({ value, onValueChange, testID }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      testID={testID}
      style={[styles.track, { backgroundColor: value ? colors.primary : colors.border }]}
    >
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 20, padding: 2, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
  knobOn: { alignSelf: "flex-end" },
  knobOff: { alignSelf: "flex-start" },
});
