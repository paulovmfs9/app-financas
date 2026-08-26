import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing, fontSizes } from "../../utils/theme";

export interface TextFieldProps extends TextInputProps {
  label: string;
  prefix?: string;
}

export function TextField({ label, prefix, onFocus, onBlur, style, testID, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}
      >
        {prefix ? <Text style={[styles.prefix, { color: colors.textMuted }]}>{prefix}</Text> : null}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
  },
  prefix: { fontSize: fontSizes.body, fontWeight: "700", marginRight: 6 },
  input: { flex: 1, fontSize: fontSizes.body, fontWeight: "700", padding: 0 },
});
